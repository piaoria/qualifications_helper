// 일정/공고 마감 알림 설정 — localStorage.
// 키 형식: 'exam:<id>' | 'job:<id>' → { days: <D-N 며칠 전> }
// WHY: 핀(boolean)과 달리 알림은 "켜짐 + 며칠 전"이 필요해 객체로 저장.
const KEY = 'qh.alarms';
export const DEFAULT_DAYS = 3;

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
};
const save = (data) => localStorage.setItem(KEY, JSON.stringify(data));

export const alarmKey = (type, id) => `${type}:${id}`;

export const getAlarm = (type, id) => load()[alarmKey(type, id)] || null;
export const isAlarmOn = (type, id) => !!getAlarm(type, id);

// 켜짐 ↔ 꺼짐. 켤 때 days 미지정이면 기본값.
export const toggleAlarm = (type, id, days = DEFAULT_DAYS) => {
  const data = load();
  const k = alarmKey(type, id);
  if (data[k]) delete data[k];
  else data[k] = { days };
  save(data);
  return !!data[k];
};

// 켜진 항목만 [{ type, id, days }] 로 반환
export const listAlarms = () =>
  Object.entries(load()).map(([k, v]) => {
    const [type, id] = k.split(':');
    return { type, id, days: v.days ?? DEFAULT_DAYS };
  });
