// 자격증 시험 일정 카드
import { html, esc } from '../utils/dom.js';
import { formatDate } from '../utils/date.js';
import { DdayBadge } from './DdayBadge.js';

// exam: exam_schedules 행 (+ certifications(name))
// 다가오는 가장 가까운 날짜를 D-day 기준으로 사용
export const ExamItem = (exam) => {
  const name = exam.certifications?.name ?? '자격증';
  const nextDate =
    exam.written_exam_start || exam.practical_exam_start || null;

  return html(`
    <article class="card card--exam">
      <header class="card__head">
        <h3 class="card__title">${esc(name)}</h3>
        ${DdayBadge(nextDate)}
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
