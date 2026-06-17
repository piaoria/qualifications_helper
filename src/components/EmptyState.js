// 데이터 없을 때 표시
import { html, esc } from '../utils/dom.js';

export const EmptyState = (message) =>
  html(`<div class="empty">📭<br>${esc(message)}</div>`);

export const LoadingState = () =>
  html(`<div class="empty">불러오는 중…</div>`);

export const ErrorState = (message) =>
  html(`<div class="empty empty--error">⚠️<br>${esc(message)}</div>`);
