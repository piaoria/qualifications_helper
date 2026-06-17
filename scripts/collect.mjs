// 데이터 수집 스크립트 — 큐넷(자격증 일정) + 원티드(공고)
// GitHub Actions cron에서 실행. service_role 키로 Supabase에 upsert.
//
// 필요 env:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATA_GO_KR_KEY
//   DRY_RUN=1 이면 DB 쓰기 없이 콘솔 출력만 (로컬 테스트용)

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  DATA_GO_KR_KEY,
  DRY_RUN,
} = process.env;

const dry = DRY_RUN === '1';

// ---- Supabase REST 헬퍼 ----
const sb = (path, init = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

const upsert = async (table, rows, onConflict) => {
  if (rows.length === 0) return 0;
  if (dry) {
    console.log(`[DRY] ${table} upsert ${rows.length}건`, JSON.stringify(rows[0]).slice(0, 200));
    return rows.length;
  }
  const res = await sb(`${table}?on_conflict=${onConflict}`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`${table} upsert 실패 ${res.status}: ${await res.text()}`);
  return rows.length;
};

const logSync = async (source, status, count, error) => {
  if (dry) return;
  await sb('sync_logs', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify([{ source, status, items_fetched: count, error_message: error ?? null }]),
  }).catch(() => {});
};

// YYYYMMDD → YYYY-MM-DD (빈 값이면 null)
const toDate = (s) => {
  if (!s || String(s).length < 8) return null;
  const v = String(s);
  return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
};
const norm = (s) => (s || '').replace(/\s/g, '');

// ============================================================
// 1. 큐넷 — 국가자격 시험일정
// ============================================================
const collectQnet = async () => {
  if (!DATA_GO_KR_KEY) {
    console.log('DATA_GO_KR_KEY 없음 → 큐넷 수집 건너뜀');
    return;
  }
  // 추적 종목 조회
  const certRes = await sb('certifications?select=id,name,qnet_code&is_active=eq.true');
  const certs = await certRes.json();
  const year = new Date().getFullYear();

  // 올해+내년 일정 수집
  let items = [];
  for (const yy of [year, year + 1]) {
    const url =
      `http://apis.data.go.kr/B490007/qualExamSchd/getQualExamSchdList` +
      `?serviceKey=${encodeURIComponent(DATA_GO_KR_KEY)}` +
      `&dataFormat=json&numOfRows=500&pageNo=1&implYy=${yy}&qualgbCd=T`;
    const res = await fetch(url);
    const json = await res.json();
    const body = json?.response?.body;
    const got = body?.items?.item ?? body?.items ?? [];
    items.push(...(Array.isArray(got) ? got : [got]));
  }

  // 종목명으로 매칭 → exam_schedules 행 생성
  const rows = [];
  for (const cert of certs) {
    const target = norm(cert.name);
    const matched = items.filter((it) => norm(it.jmfldnm || it.jmNm || it.qualNm).includes(target));
    for (const it of matched) {
      const round = `${it.implYy || ''}년 ${it.qualgbNm || '기사'} ${it.implSeq || ''}회`.trim();
      rows.push({
        certification_id: cert.id,
        round,
        year: Number(it.implYy) || null,
        written_apply_start: toDate(it.docRegStartDt),
        written_apply_end: toDate(it.docRegEndDt),
        written_exam_start: toDate(it.docExamStartDt),
        written_exam_end: toDate(it.docExamEndDt),
        written_result_date: toDate(it.docPassDt),
        practical_apply_start: toDate(it.pracRegStartDt),
        practical_apply_end: toDate(it.pracRegEndDt),
        practical_exam_start: toDate(it.pracExamStartDt),
        practical_exam_end: toDate(it.pracExamEndDt),
        final_result_date: toDate(it.pracPassDt),
        raw: it,
        fetched_at: new Date().toISOString(),
      });
    }
  }

  const n = await upsert('exam_schedules', rows, 'certification_id,round');
  console.log(`큐넷: ${items.length}건 수신 → ${n}건 저장`);
  await logSync('qnet', 'success', n);
};

// ============================================================
// 2. 원티드 — 채용 공고
// ============================================================
// 직무명 → 원티드 카테고리 매핑
const WANTED_JOBS = {
  Frontend: { job_group_id: 518, job_ids: 669 },
};

const collectWanted = async () => {
  const filterRes = await sb('job_filters?select=*&is_active=eq.true');
  const filters = await filterRes.json();

  let total = 0;
  for (const f of filters) {
    const map = WANTED_JOBS[f.job_category];
    if (!map) {
      console.log(`원티드 매핑 없음: ${f.job_category} → 건너뜀`);
      continue;
    }
    const url =
      `https://www.wanted.co.kr/api/chaos/navigation/v1/results` +
      `?job_group_id=${map.job_group_id}&job_ids=${map.job_ids}` +
      `&years=-1&locations=all&company_types=all&limit=100&offset=0`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const json = await res.json();
    const list = json?.data ?? [];

    const threshold = f.experience_max > 0 ? f.experience_max : 3;
    const rows = [];
    for (const it of list) {
      // 경력 필터: 신입이거나 요구 경력 하한이 임계 이하
      if (!it.is_newbie && (it.annual_from ?? 99) > threshold) continue;
      // 지역 필터
      if (f.location && !(it.address?.location || '').includes(f.location)) continue;
      // 키워드 제외
      const pos = it.position || '';
      if ((f.keywords_exclude || []).some((k) => pos.includes(k))) continue;
      if ((f.keywords_include || []).length && !(f.keywords_include).some((k) => pos.includes(k))) continue;

      const exp = it.is_newbie
        ? '신입'
        : `${it.annual_from ?? '?'}~${it.annual_to ?? '?'}년`;
      rows.push({
        source: 'wanted',
        external_id: String(it.id),
        company_name: it.company?.name ?? null,
        position: pos,
        job_category: f.job_category,
        experience: exp,
        location: [it.address?.location, it.address?.district].filter(Boolean).join(' '),
        url: `https://www.wanted.co.kr/wd/${it.id}`,
        due_date: null, // 원티드 목록 API는 마감일 미제공 (상시)
        filter_id: f.id,
        raw: it,
        fetched_at: new Date().toISOString(),
      });
    }
    total += await upsert('job_postings', rows, 'source,external_id');
    console.log(`원티드[${f.name}]: ${list.length}건 수신 → ${rows.length}건 매칭`);
  }
  await logSync('wanted', 'success', total);
};

// ============================================================
const main = async () => {
  console.log(`수집 시작 (dry=${dry})`);
  try {
    await collectQnet();
  } catch (e) {
    console.error('큐넷 실패:', e.message);
    await logSync('qnet', 'error', 0, e.message);
  }
  try {
    await collectWanted();
  } catch (e) {
    console.error('원티드 실패:', e.message);
    await logSync('wanted', 'error', 0, e.message);
  }
  console.log('수집 종료');
};

main();
