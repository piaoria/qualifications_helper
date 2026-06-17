// 자격증 단계 타임라인: 필기(접수·시험·발표) / 실기(접수·시험·발표) 2줄.
// 날짜로 자동 진행 표시 + 단계를 탭해 합격/불합격 수동 보정.
import { html } from '../utils/dom.js';
import { daysUntil, formatDate } from '../utils/date.js';
import { getProgress, cycleStage } from '../services/progressService.js';

// 접수는 마감일, 시험/발표는 해당일 기준 (nextMilestone과 동일 기준)
const GROUPS = [
  {
    label: '필기',
    steps: [
      { key: 'written_apply', label: '접수', dateKey: 'written_apply_end' },
      { key: 'written_exam', label: '시험', dateKey: 'written_exam_start' },
      { key: 'written_result', label: '발표', dateKey: 'written_result_date' },
    ],
  },
  {
    label: '실기',
    steps: [
      { key: 'practical_apply', label: '접수', dateKey: 'practical_apply_end' },
      { key: 'practical_exam', label: '시험', dateKey: 'practical_exam_start' },
      { key: 'practical_result', label: '발표', dateKey: 'final_result_date' },
    ],
  },
];
const ORDER = GROUPS.flatMap((g) => g.steps);

const stageState = (exam, step, userStatus) => {
  if (userStatus === 'pass') return 'pass';
  if (userStatus === 'fail') return 'fail';
  const d = daysUntil(exam[step.dateKey]);
  if (d === null) return 'upcoming';
  return d < 0 ? 'await' : 'future';
};

const dot = (state, idx) => (state === 'pass' ? '✓' : state === 'fail' ? '✕' : idx + 1);
const mmdd = (s) => (s ? formatDate(s).slice(5) : '–');

export const CertTimeline = (exam) => {
  const root = document.createElement('div');
  root.className = 'tl';

  const render = () => {
    const prog = getProgress(exam.id);
    // 현재 단계 = 아직 안 지난 첫 단계 (오늘 할 일)
    const currentKey = (ORDER.find((s) => {
      const d = daysUntil(exam[s.dateKey]);
      return d !== null && d >= 0;
    }) || {}).key;

    root.replaceChildren();
    GROUPS.forEach((group) => {
      // 그룹에 일정이 하나도 없으면 줄 자체 생략 (예: 실기 없는 자격증)
      if (!group.steps.some((s) => exam[s.dateKey])) return;

      const track = html('<div class="tl__track"></div>');
      group.steps.forEach((step, i) => {
        if (!exam[step.dateKey]) {
          track.append(html('<div class="tl__step tl__step--empty"></div>'));
          return;
        }
        const status = prog[step.key] || null;
        const state = stageState(exam, step, status);
        const active = step.key === currentKey;
        const node = html(`
          <button class="tl__step tl__step--${state} ${active ? 'tl__step--active' : ''}"
                  data-stage="${step.key}" title="탭하여 합격/불합격 표시">
            <span class="tl__dot">${dot(state, i)}</span>
            <span class="tl__label">${step.label}</span>
            <span class="tl__date">${mmdd(exam[step.dateKey])}</span>
          </button>
        `);
        node.addEventListener('click', () => {
          cycleStage(exam.id, step.key);
          render();
        });
        track.append(node);
      });

      const row = html(`<div class="tl__group"><span class="tl__group-label">${group.label}</span></div>`);
      row.append(track);
      root.append(row);
    });
  };

  render();
  return root;
};
