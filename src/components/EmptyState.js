// 데이터 없음 / 로딩 / 에러 상태
import { html, esc } from '../utils/dom.js';
import { Icon } from './Icon.js';

export const EmptyState = (message, icon = 'inbox') =>
  html(`<div class="empty">${Icon(icon, { size: 30 })}<p>${esc(message)}</p></div>`);

// 로딩 중 — 카드 모양 스켈레톤(시머). count개 placeholder.
export const LoadingState = (count = 3) => {
  const card = `
    <article class="skel-card">
      <div class="skel-row">
        <span class="skel-bar skel-bar--title"></span>
        <span class="skel-bar skel-bar--badge"></span>
      </div>
      <span class="skel-bar skel-bar--line1"></span>
      <span class="skel-bar skel-bar--line2"></span>
    </article>`;
  return html(`<div class="skel" aria-busy="true" aria-label="불러오는 중">${card.repeat(count)}</div>`);
};

export const ErrorState = (message) =>
  html(`<div class="empty empty--error">${Icon('alert', { size: 30 })}<p>${esc(message)}</p></div>`);
