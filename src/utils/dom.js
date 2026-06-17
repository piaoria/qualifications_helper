// 간단한 DOM 헬퍼

// HTML 문자열 → DOM 요소
export const html = (str) => {
  const t = document.createElement('template');
  t.innerHTML = str.trim();
  return t.content.firstElementChild;
};

// XSS 방지용 텍스트 이스케이프
export const esc = (v) => {
  if (v === null || v === undefined) return '';
  return String(v)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
};
