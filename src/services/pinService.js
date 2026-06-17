// 일정/공고 고정(핀) — localStorage. 핀한 항목은 어느 페이지든 상단 노출.
// 키 형식: 'exam:<id>' | 'job:<id>'
const KEY = 'qh.pins';

const load = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY)) || []);
  } catch {
    return new Set();
  }
};
const save = (set) => localStorage.setItem(KEY, JSON.stringify([...set]));

export const pinKey = (type, id) => `${type}:${id}`;
export const isPinned = (type, id) => load().has(pinKey(type, id));
export const togglePin = (type, id) => {
  const s = load();
  const k = pinKey(type, id);
  if (s.has(k)) s.delete(k);
  else s.add(k);
  save(s);
  return s.has(k);
};
