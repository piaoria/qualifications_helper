// 자격증 시험 일정 카드
import { html, esc } from '../utils/dom.js';
import { formatDate } from '../utils/date.js';
import { DdayBadge } from './DdayBadge.js';
import { nextMilestone } from '../utils/exam.js';

// exam: exam_schedules 행 (+ certifications(name))
// 다음에 닥치는 단계(접수/시험/발표)까지 D-day 표시
export const ExamItem = (exam) => {
  const name = exam.certifications?.name ?? '자격증';
  const next = nextMilestone(exam);
  const dday = next
    ? `<span class="card__next">${next.label}</span>${DdayBadge(next.date)}`
    : '<span class="badge badge--past">종료</span>';

  return html(`
    <article class="card card--exam">
      <header class="card__head">
        <h3 class="card__title">${esc(name)}</h3>
        <div class="card__dday">${dday}</div>
      </header>
      <p class="card__round">${esc(exam.round)}</p>
      <dl class="card__dates">
        <div><dt>필기접수</dt><dd>${formatDate(exam.written_apply_start)}~${formatDate(exam.written_apply_end)}</dd></div>
        <div><dt>필기시험</dt><dd>${formatDate(exam.written_exam_start)}</dd></div>
        <div><dt>실기시험</dt><dd>${formatDate(exam.practical_exam_start)}</dd></div>
        <div><dt>최종발표</dt><dd>${formatDate(exam.final_result_date)}</dd></div>
      </dl>
    </article>
  `);
};
