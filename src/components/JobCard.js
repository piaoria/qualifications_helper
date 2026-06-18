// 채용 공고 카드
import { html, esc } from '../utils/dom.js';
import { formatDate } from '../utils/date.js';
import { DdayBadge } from './DdayBadge.js';
import { Icon } from './Icon.js';

// job: job_postings 행 (+ _pinned / _alarmOn 여부)
// onBookmark / onHide / onPin / onAlarm: (id) => void 콜백
export const JobCard = (job, { onBookmark, onHide, onPin, onAlarm } = {}) => {
  // 마감일 있는 공고만 알림 의미 있음 (상시 채용은 알림 버튼 숨김)
  const alarmBtn = job.due_date
    ? `<button class="alarm ${job._alarmOn ? 'alarm--on' : ''}" data-alarm aria-label="알림" title="마감 알림">${Icon('bell', { size: 18, fill: job._alarmOn })}</button>`
    : '';
  const el = html(`
    <article class="card card--job ${job._pinned ? 'card--pinned' : ''}">
      <header class="card__head">
        <h3 class="card__title">${esc(job.company_name)}</h3>
        <div class="card__dday">
          ${alarmBtn}
          <button class="pin ${job._pinned ? 'pin--on' : ''}" data-pin>${job._pinned ? '고정됨' : '고정'}</button>
          ${DdayBadge(job.due_date)}
        </div>
      </header>
      <p class="card__pos">${esc(job.position)}</p>
      <p class="card__meta">
        <span>${esc(job.job_category ?? '-')}</span> ·
        <span>${esc(job.experience ?? '-')}</span> ·
        <span>${esc(job.location ?? '-')}</span>
      </p>
      <p class="card__due">${job.due_date ? `마감: ${formatDate(job.due_date)}` : '상시 채용'}</p>
      <p class="card__posted">등록 ${formatDate(job.fetched_at)}</p>
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
  el.querySelector('[data-pin]').addEventListener('click', () => onPin?.(job.id));
  el.querySelector('[data-alarm]')?.addEventListener('click', () => onAlarm?.(job.id));
  return el;
};
