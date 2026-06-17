// 데이터 없음 / 로딩 / 에러 상태
import { html, esc } from '../utils/dom.js';
import { Icon } from './Icon.js';

export const EmptyState = (message, icon = 'inbox') =>
  html(`<div class="empty">${Icon(icon, { size: 30 })}<p>${esc(message)}</p></div>`);

export const LoadingState = () =>
  html(`<div class="empty"><p>불러오는 중…</p></div>`);

export const ErrorState = (message) =>
  html(`<div class="empty empty--error">${Icon('alert', { size: 30 })}<p>${esc(message)}</p></div>`);
