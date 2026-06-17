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

// 이벤트 배열 → 날짜별 Map
export const groupByDate = (events) => {
  const map = new Map();
  for (const ev of events) {
    if (!map.has(ev.date)) map.set(ev.date, []);
    map.get(ev.date).push(ev);
  }
  return map;
};
