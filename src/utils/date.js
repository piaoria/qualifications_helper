// 날짜 계산 / 포맷 유틸 (순수 함수)

// 오늘 0시 기준 Date
const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// 대상일까지 남은 일수 (음수면 지난 날짜). 입력 없으면 null
export const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = target - today();
  return Math.round(diff / 86400000);
};

// D-day 라벨: D-3 / D-DAY / D+2
export const ddayLabel = (dateStr) => {
  const d = daysUntil(dateStr);
  if (d === null) return '';
  if (d === 0) return 'D-DAY';
  return d > 0 ? `D-${d}` : `D+${Math.abs(d)}`;
};

// YYYY-MM-DD → 2026.06.17
export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return dateStr.replaceAll('-', '.').slice(0, 10);
};
