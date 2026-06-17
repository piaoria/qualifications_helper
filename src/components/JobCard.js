// 채용 공고 카드
import { html, esc } from '../utils/dom.js';
import { formatDate } from '../utils/date.js';
import { DdayBadge } from './DdayBadge.js';
import { Icon } from './Icon.js';

// job: job_postings 행
// onBookmark / onHide: (id) => void 콜백
export const JobCard = (job, { onBookmark, onHide } = {}) => {
  const el = html(`
    <article class="card card--job">
      <header class="card__head">
        <h3 class="card__title">${esc(job.company_name)}</h3>
        ${DdayBadge(job.due_date)}
      </header>
      <p class="card__pos">${esc(job.position)}</p>
      <p class="card__meta">
        <span>${esc(job.job_category ?? '-')}</span> ·
        <span>${esc(job.experience ?? '-')}</span> ·
        <span>${esc(job.location ?? '-')}</span>
      </p>
      <p class="card__due">마감: ${formatDate(job.due_date)}</p>
      <footer class="card__actions">
        <button class="btn btn--bookmark" aria-pressed="${job.is_bookmarked}">
          ${Icon('bookmark', { size: 15, fill: job.is_bookmarked })}<span>관심</span>
        </button>
        <a class="btn btn--link" href="${esc(job.url)}" target="_blank" rel="noopener">
          ${Icon('link', { size: 15 })}<span>공고</span>
        </a>
        <button class="btn btn--hide">${Icon('x', { size: 15 })}<span>숨김</span></button>
      </footer>
    </article>
  `);

  el.querySelector('.btn--bookmark').addEventListener('click', () =>
    onBookmark?.(job.id, !job.is_bookmarked)
  );
  el.querySelector('.btn--hide').addEventListener('click', () =>
    onHide?.(job.id)
  );
  return el;
};
