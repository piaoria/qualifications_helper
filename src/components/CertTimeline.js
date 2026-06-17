// 자격증 단계 타임라인: 필기지원 → 필기합격 → 실기지원 → 실기합격
// 날짜로 자동 진행 표시 + 단계를 탭해 합격/불합격 수동 보정.
import { html } from '../utils/dom.js';
import { daysUntil, formatDate } from '../utils/date.js';
import { getProgress, cycleStage } from '../services/progressService.js';

// dateKey: exam_schedules 행에서 단계 기준일. 일부 단계는 정확한 컬럼이 없어 근사값 사용.
const STAGES = [
  { key: 'written_apply', label: '필기 지원', dateKey: 'written_apply_end' },
  { key: 'written_pass', label: '필기 합격', dateKey: 'written_exam_start' },
  { key: 'practical_apply', label: '실기 지원', dateKey: 'practical_exam_start' },
  { key: 'practical_pass', label: '실기 합격', dateKey: 'final_result_date' },
];

const stageState = (exam, stage, userStatus) => {
  if (userStatus === 'pass') return 'pass';
  if (userStatus === 'fail') return 'fail';
  const d = daysUntil(exam[stage.dateKey]);
  if (d === null) return 'upcoming';
  return d < 0 ? 'await' : 'future';
};

const dot = (state, idx) =>
  state === 'pass' ? '✓' : state === 'fail' ? '✕' : idx + 1;

const mmdd = (dateStr) => (dateStr ? formatDate(dateStr).slice(5) : '–');

export const CertTimeline = (exam) => {
  const root = document.createElement('div');
  root.className = 'tl';

  const render = () => {
    const prog = getProgress(exam.id);
    // 현재 단계 = 아직 안 지난 첫 단계 (오늘 할 일)
    const current = STAGES.findIndex((s) => {
      const d = daysUntil(exam[s.dateKey]);
      return d !== null && d >= 0;
    });

    root.replaceChildren();
    STAGES.forEach((stage, i) => {
      // 해당 일정이 없으면(예: 실기 없는 자격증) 빈 칸으로 두고 렌더 생략
      if (!exam[stage.dateKey]) {
        root.append(html('<div class="tl__step tl__step--empty"></div>'));
        return;
      }
      const status = prog[stage.key] || null;
      const state = stageState(exam, stage, status);
      const active = i === current && state === 'future';
      const node = html(`
        <button class="tl__step tl__step--${state} ${active ? 'tl__step--active' : ''}"
                data-stage="${stage.key}" title="탭하여 합격/불합격 표시">
          <span class="tl__dot">${dot(state, i)}</span>
          <span class="tl__label">${stage.label}</span>
          <span class="tl__date">${mmdd(exam[stage.dateKey])}</span>
        </button>
      `);
      node.addEventListener('click', () => {
        cycleStage(exam.id, stage.key);
        render();
      });
      root.append(node);
    });
  };

  render();
  return root;
};
