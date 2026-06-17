// D-day 뱃지 (HTML 문자열 반환)
import { ddayLabel, daysUntil } from '../utils/date.js';

export const DdayBadge = (dateStr) => {
  const label = ddayLabel(dateStr);
  if (!label) return '';
  const d = daysUntil(dateStr);
  // 임박(3일 이내)·지남 상태에 따라 클래스 분기
  let state = 'far';
  if (d < 0) state = 'past';
  else if (d <= 3) state = 'soon';
  return `<span class="badge badge--${state}">${label}</span>`;
};
