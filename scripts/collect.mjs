// 데이터 수집 스크립트 — 큐넷(자격증 일정) + 원티드(공고)
// GitHub Actions cron에서 실행. service_role 키로 Supabase에 upsert.
//
// 필요 env:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATA_GO_KR_KEY
//   SARAMIN_ACCESS_KEY (선택: 있으면 사람인 공고도 수집)
//   DRY_RUN=1 이면 DB 쓰기 없이 콘솔 출력만 (로컬 테스트용)

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  DATA_GO_KR_KEY,
  SARAMIN_ACCESS_KEY,
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
// 큐넷(인력공단) API에 없는 별도 시행 종목의 2026 일정 (직접 입력).
// 출처: 데이터자격검정 / KCA 공고 기준. 연 1회 갱신 필요.
const MANUAL_SCHEDULES = {
  빅데이터분석기사: [
    {
      round: '2026년 제12회', year: 2026,
      written_apply_start: '2026-03-03', written_apply_end: '2026-03-09',
      written_exam_start: '2026-04-04', written_result_date: '2026-04-24',
      practical_apply_start: '2026-05-18', practical_apply_end: '2026-05-22',
      practical_exam_start: '2026-06-20', final_result_date: '2026-07-10',
    },
    {
      round: '2026년 제13회', year: 2026,
      written_apply_start: '2026-08-03', written_apply_end: '2026-08-07',
      written_exam_start: '2026-09-05', written_result_date: '2026-09-23',
      practical_apply_start: '2026-10-26', practical_apply_end: '2026-10-30',
      practical_exam_start: '2026-11-28', final_result_date: '2026-12-18',
    },
  ],
  정보보안기사: [
    {
      round: '2026년 제1회', year: 2026,
      written_apply_start: '2026-01-26', written_apply_end: '2026-01-29',
      written_exam_start: '2026-02-09', written_exam_end: '2026-03-06', written_result_date: '2026-03-13',
      practical_apply_start: '2026-03-16', practical_apply_end: '2026-03-19',
      practical_exam_start: '2026-04-11', practical_exam_end: '2026-04-26', final_result_date: '2026-05-08',
    },
    {
      round: '2026년 제2회', year: 2026,
      written_apply_start: '2026-05-11', written_apply_end: '2026-05-14',
      written_exam_start: '2026-05-22', written_exam_end: '2026-06-15', written_result_date: '2026-06-19',
      practical_apply_start: '2026-06-22', practical_apply_end: '2026-06-25',
      practical_exam_start: '2026-07-25', practical_exam_end: '2026-08-09', final_result_date: '2026-08-28',
    },
    {
      round: '2026년 제4회', year: 2026,
      written_apply_start: '2026-08-31', written_apply_end: '2026-09-03',
      written_exam_start: '2026-09-14', written_exam_end: '2026-10-08', written_result_date: '2026-10-16',
      practical_apply_start: '2026-10-19', practical_apply_end: '2026-10-22',
      practical_exam_start: '2026-11-14', practical_exam_end: '2026-11-29', final_result_date: '2026-12-18',
    },
  ],
};

const collectQnet = async () => {
  if (!DATA_GO_KR_KEY) {
    console.log('DATA_GO_KR_KEY 없음 → 큐넷 수집 건너뜀');
    return;
  }
  // 추적 종목 조회
  const certRes = await sb('certifications?select=id,name,qnet_code&is_active=eq.true');
  const certs = await certRes.json();
  const year = new Date().getFullYear();

  // 키 형태 자동 판별: 이미 인코딩된 키(% 포함)면 그대로, 아니면 인코딩
  const keyParam = DATA_GO_KR_KEY.includes('%') ? DATA_GO_KR_KEY : encodeURIComponent(DATA_GO_KR_KEY);

  // 올해+내년 일정 수집 (numOfRows 최대 50 → 페이지네이션)
  const PAGE = 50;
  let items = [];
  for (const yy of [year, year + 1]) {
    for (let pageNo = 1; pageNo <= 40; pageNo++) {
      const url =
        `http://apis.data.go.kr/B490007/qualExamSchd/getQualExamSchdList` +
        `?serviceKey=${keyParam}` +
        `&dataFormat=json&numOfRows=${PAGE}&pageNo=${pageNo}&implYy=${yy}&qualgbCd=T`;
      const res = await fetch(url);
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(`큐넷 응답이 JSON 아님(키 미인증 가능): "${text.slice(0, 80)}"`);
      }
      // 응답 구조: { header, body: { items: [...] | { item: [...] } } }
      const body = json?.body ?? json?.response?.body;
      const got = body?.items?.item ?? body?.items ?? [];
      const arr = Array.isArray(got) ? got : got ? [got] : [];
      items.push(...arr);
      if (arr.length < PAGE) break; // 마지막 페이지
    }
  }

  // 이 API는 등급별(기사/산업기사/기능사) 정기시험 일정만 제공 (종목 구분 없음).
  // description 예: "국가기술자격 기사 (2026년도 제3회)" → 등급 "기사" 추출
  const gradeOf = (desc) => {
    const m = /국가기술자격\s+(\S+?)\s*\(/.exec(desc || '');
    return m ? m[1] : '';
  };

  const now = new Date().toISOString();
  const rows = [];
  const manualCertIds = [];

  for (const cert of certs) {
    const manual = MANUAL_SCHEDULES[cert.name];
    if (manual) {
      // 큐넷 API에 없는 종목(별도 시행) → 직접 입력한 일정 사용
      manualCertIds.push(cert.id);
      for (const m of manual) {
        rows.push({ certification_id: cert.id, source: 'manual', raw: { manual: true }, fetched_at: now, ...m });
      }
    } else {
      // 정기검정 따르는 종목(예: 정보처리기사) → 큐넷 등급 매칭
      const grade = cert.category || '기사';
      const matched = items.filter((it) => gradeOf(it.description) === grade);
      for (const it of matched) {
        rows.push({
          certification_id: cert.id,
          source: 'qnet',
          round: it.description || `${it.implYy} ${it.implSeq}회`,
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
          fetched_at: now,
        });
      }
    }
  }

  // (certification_id, round) 중복 제거 — API가 같은 회차를 여러 번 반환
  const seen = new Map();
  for (const r of rows) seen.set(`${r.certification_id}|${r.round}`, r);
  // 모든 행을 동일 컬럼 셋으로 정규화 (PostgREST 일괄 upsert는 키 구성이 같아야 함)
  const COLS = [
    'certification_id', 'source', 'round', 'year',
    'written_apply_start', 'written_apply_end', 'written_exam_start', 'written_exam_end', 'written_result_date',
    'practical_apply_start', 'practical_apply_end', 'practical_exam_start', 'practical_exam_end', 'final_result_date',
    'raw', 'fetched_at',
  ];
  const deduped = [...seen.values()].map((r) => Object.fromEntries(COLS.map((c) => [c, r[c] ?? null])));

  // 수동 종목에 과거 잘못 들어간 큐넷(정기 기사) 행 제거
  if (!dry) {
    for (const id of manualCertIds) {
      await sb(`exam_schedules?certification_id=eq.${id}&source=eq.qnet`, {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' },
      }).catch(() => {});
    }
  }

  const n = await upsert('exam_schedules', deduped, 'certification_id,round');
  console.log(`큐넷: ${items.length}건 수신 → ${n}건 저장 (수동 ${manualCertIds.length}종목)`);
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
// 사람인 채용공고 (공식 Open API) — 실제 마감일/게시일 제공
// 키워드/지역은 job_filters 재사용. SARAMIN_ACCESS_KEY 없으면 건너뜀.
const SARAMIN_API = 'https://oapi.saramin.co.kr/job-search';

const collectSaramin = async () => {
  if (!SARAMIN_ACCESS_KEY) {
    console.log('사람인: SARAMIN_ACCESS_KEY 없음 → 건너뜀');
    return;
  }
  const filterRes = await sb('job_filters?select=*&is_active=eq.true');
  const filters = await filterRes.json();

  let total = 0;
  for (const f of filters) {
    const kw = (f.keywords_include?.length ? f.keywords_include : [f.job_category])
      .filter(Boolean)
      .join(','); // 사람인 keywords 콤마 = OR
    const params = new URLSearchParams({
      'access-key': SARAMIN_ACCESS_KEY,
      keywords: kw,
      sort: 'pd', // 게시일 역순(최신)
      count: '110',
      start: '0',
    });
    const res = await fetch(`${SARAMIN_API}?${params}`, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      console.log(`사람인[${f.name}] 응답 실패 ${res.status}`);
      continue;
    }
    const json = await res.json();
    const list = json?.jobs?.job ?? [];

    const rows = [];
    for (const it of list) {
      const title = it.position?.title || '';
      if ((f.keywords_exclude || []).some((k) => title.includes(k))) continue;
      const loc = it.position?.location?.name || '';
      if (f.location && !loc.includes(f.location)) continue;

      rows.push({
        source: 'saramin',
        external_id: String(it.id),
        company_name: it.company?.detail?.name ?? null,
        position: title,
        job_category: it.position?.['job-mid-code']?.name ?? f.job_category,
        experience: it.position?.['experience-level']?.name ?? null,
        location: loc || null,
        url: it.url ?? null,
        due_date: (it['expiration-date'] || '').slice(0, 10) || null, // 실제 마감일
        filter_id: f.id,
        raw: it, // posting-date 등 원본 보존
        fetched_at: new Date().toISOString(),
      });
    }
    total += await upsert('job_postings', rows, 'source,external_id');
    console.log(`사람인[${f.name}]: ${list.length}건 수신 → ${rows.length}건 매칭`);
  }
  await logSync('saramin', 'success', total);
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
  try {
    await collectSaramin();
  } catch (e) {
    console.error('사람인 실패:', e.message);
    await logSync('saramin', 'error', 0, e.message);
  }
  console.log('수집 종료');
};

main();
