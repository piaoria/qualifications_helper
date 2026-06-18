// 로컬 알림(A) — 앱 열 때 임박 일정 검사 후 시스템 알림 표시.
// WHY: 서버 없이 동작. 단 앱이 열렸을 때만 검사 가능(백그라운드 발송은 B/푸시).
import { listAlarms } from './alarmService.js';
import { nextMilestone } from '../utils/exam.js';
import { daysUntil, ddayLabel, formatDate } from '../utils/date.js';
import { addLog } from '../utils/notifyStore.js';

// 같은 항목·같은 마감일에 대해 한 번만 알림 (중복 방지)
const SENT_KEY = 'qh.alarm.sent';
const loadSent = () => {
  try {
    return JSON.parse(localStorage.getItem(SENT_KEY)) || {};
  } catch {
    return {};
  }
};
const markSent = (token) => {
  const s = loadSent();
  s[token] = 1;
  localStorage.setItem(SENT_KEY, JSON.stringify(s));
};

export const notifySupported = () =>
  'Notification' in window && 'serviceWorker' in navigator;

export const notifyPermission = () =>
  notifySupported() ? Notification.permission : 'unsupported';

// 사용자 동작(토글 클릭) 안에서 호출해야 권한 팝업이 뜸
export const ensurePermission = async () => {
  if (!notifySupported()) return 'unsupported';
  if (Notification.permission === 'default') {
    return Notification.requestPermission();
  }
  return Notification.permission;
};

// 알림 1건 표시 (SW 등록 통해 — 모바일/iOS 호환)
const show = async (title, opts) => {
  const reg = await navigator.serviceWorker.ready;
  return reg.showNotification(title, opts);
};

// 알림 켜진 항목 중 오늘이 D-N 이내인 것 알림. exams/jobs 데이터를 받아 검사.
export const runLocalCheck = async (exams = [], jobs = []) => {
  if (notifyPermission() !== 'granted') return;
  const examById = new Map(exams.map((e) => [String(e.id), e]));
  const jobById = new Map(jobs.map((j) => [String(j.id), j]));

  for (const { type, id, days } of listAlarms()) {
    let date = null;
    let name = '';
    let stage = '마감';
    if (type === 'exam') {
      const e = examById.get(id);
      if (!e) continue;
      const next = nextMilestone(e);
      if (!next) continue;
      date = next.date;
      stage = next.label;
      name = e.certifications?.name ?? '자격증';
    } else if (type === 'job') {
      const j = jobById.get(id);
      if (!j || !j.due_date) continue;
      date = j.due_date;
      name = `[${j.company_name}] ${j.position}`;
    }

    const left = daysUntil(date);
    if (left === null || left < 0 || left > days) continue;

    const token = `${type}:${id}@${date}`;
    if (loadSent()[token]) continue;

    const body = `${name} ${stage} ${ddayLabel(date)}\n${formatDate(date)}`;
    await show('취준이', {
      body,
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      tag: token,
      data: { type, id },
    });
    await addLog({ title: '취준이', body, type, refId: id, channel: 'local' });
    markSent(token);
  }
};
