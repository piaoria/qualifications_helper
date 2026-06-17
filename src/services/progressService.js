// 자격증 단계별 개인 진행상태 (localStorage)
// 시험일정 ID별로 { [stageKey]: 'pass' | 'fail' } 저장.
// WHY: 합격 여부는 날짜로 알 수 없어 사용자가 직접 표시해야 진짜 진행 상황이 됨.
const KEY = 'qh.cert.progress';

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
};

const save = (data) => localStorage.setItem(KEY, JSON.stringify(data));

export const getProgress = (scheduleId) => load()[scheduleId] || {};

// 탭할 때마다 미입력 → 합격 → 불합격 → 미입력 순환
const NEXT = { null: 'pass', pass: 'fail', fail: null };

export const cycleStage = (scheduleId, stageKey) => {
  const data = load();
  const cur = (data[scheduleId] || {})[stageKey] || null;
  const next = NEXT[cur];
  data[scheduleId] = data[scheduleId] || {};
  if (next === null) delete data[scheduleId][stageKey];
  else data[scheduleId][stageKey] = next;
  save(data);
  return next;
};
