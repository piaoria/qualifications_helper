// 달력 계산 + 일정 이벤트 변환 (순수 함수)

// Date → 'YYYY-MM-DD'
export const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// 해당 월의 달력 셀 배열 (앞뒤 빈칸 포함, 7의 배수). 빈칸은 null
export const buildMonthGrid = (year, month) => {
  const startDay = new Date(year, month, 1).getDay(); // 0=일
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

// 시험 일정 → 개별 이벤트 (접수/시험/발표)
export const examEvents = (exams) => {
  const evs = [];
  const add = (date, type, label) => {
    if (date) evs.push({ date: String(date).slice(0, 10), type, label });
  };
  for (const e of exams) {
    const name = e.certifications?.name ?? '자격증';
    add(e.written_apply_start, 'apply', `${name} 필기접수`);
    add(e.written_exam_start, 'exam', `${name} 필기시험`);
    add(e.written_result_date, 'result', `${name} 필기발표`);
    add(e.practical_apply_start, 'apply', `${name} 실기접수`);
    add(e.practical_exam_start, 'exam', `${name} 실기시험`);
    add(e.final_result_date, 'result', `${name} 최종발표`);
  }
  return evs;
};

// 공고 마감일 → 이벤트 (마감일 있는 것만)
export const jobEvents = (jobs) =>
  jobs
    .filter((j) => j.due_date)
    .map((j) => ({ date: String(j.due_date).slice(0, 10), type: 'job', label: `${j.company_name} 마감` }));

const d10 = (v) => String(v).slice(0, 10);
const eachDay = (start, end) => {
  const out = [];
  const d = new Date(start);
  const e = new Date(end);
  while (d <= e) {
    out.push(ymd(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
};

// 다일 기간 → 막대 이벤트 (접수기간, 기간형 시험). 시작==종료(단일)는 제외
export const rangeEvents = (exams) => {
  const out = [];
  const add = (s, e, type, label) => {
    if (!s || !e) return;
    const ss = d10(s);
    const ee = d10(e);
    if (ee <= ss) return; // 단일일은 점으로 처리
    out.push({ start: ss, end: ee, type, label });
  };
  for (const ex of exams) {
    const name = ex.certifications?.name ?? '자격증';
    add(ex.written_apply_start, ex.written_apply_end, 'apply', `${name} 필기접수`);
    add(ex.practical_apply_start, ex.practical_apply_end, 'apply', `${name} 실기접수`);
    add(ex.written_exam_start, ex.written_exam_end, 'exam', `${name} 필기시험`);
    add(ex.practical_exam_start, ex.practical_exam_end, 'exam', `${name} 실기시험`);
  }
  return out;
};

// 단일 일자 → 점 이벤트 (시험일·발표일·공고 마감, 단일 접수)
export const pointEvents = (exams, jobs) => {
  const evs = [];
  const add = (date, type, label) => {
    if (date) evs.push({ date: d10(date), type, label });
  };
  const single = (s, e) => s && (!e || d10(e) <= d10(s));
  for (const ex of exams) {
    const name = ex.certifications?.name ?? '자격증';
    if (single(ex.written_apply_start, ex.written_apply_end)) add(ex.written_apply_start, 'apply', `${name} 필기접수`);
    if (single(ex.practical_apply_start, ex.practical_apply_end)) add(ex.practical_apply_start, 'apply', `${name} 실기접수`);
    if (single(ex.written_exam_start, ex.written_exam_end)) add(ex.written_exam_start, 'exam', `${name} 필기시험`);
    if (single(ex.practical_exam_start, ex.practical_exam_end)) add(ex.practical_exam_start, 'exam', `${name} 실기시험`);
    add(ex.written_result_date, 'result', `${name} 필기발표`);
    add(ex.final_result_date, 'result', `${name} 최종발표`);
  }
  for (const j of jobs) add(j.due_date, 'job', `${j.company_name} 마감`);
  return evs;
};

// 상세 리스트용: 기간을 일자별로 펼치고 단일 이벤트 합쳐 날짜별 Map
export const expandByDate = (ranges, points) => {
  const map = new Map();
  const push = (date, ev) => {
    if (!map.has(date)) map.set(date, []);
    map.get(date).push(ev);
  };
  for (const r of ranges) for (const day of eachDay(r.start, r.end)) push(day, { type: r.type, label: r.label });
  for (const p of points) push(p.date, { type: p.type, label: p.label });
  return map;
};

// 이벤트 배열 → 날짜별 Map
export const groupByDate = (events) => {
  const map = new Map();
  for (const ev of events) {
    if (!map.has(ev.date)) map.set(ev.date, []);
    map.get(ev.date).push(ev);
  }
  return map;
};
