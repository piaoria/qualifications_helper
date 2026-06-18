// 웹푸시(B) 구독 관리 — 브라우저 푸시 구독 후 Supabase에 저장.
// 흐름: 권한 → SW 구독(VAPID 공개키) → push_subscriptions 테이블 upsert.
import { supabase } from './supabaseClient.js';
import { VAPID_PUBLIC_KEY } from '../config.js';
import { listAlarms } from './alarmService.js';

export const pushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window;

// 서버 푸시(B)가 실제로 구독돼 있는지. WHY: 구독돼 있으면 로컬(A) 검사는
// 같은 알림을 중복 발송하므로 건너뛰기 위함.
export const isPushActive = async () => {
  if (!pushSupported() || !VAPID_PUBLIC_KEY) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    return !!(await reg.pushManager.getSubscription());
  } catch {
    return false;
  }
};

// VAPID 공개키(base64url) → Uint8Array (applicationServerKey 형식)
const urlBase64ToUint8Array = (base64) => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

// 기기별 안정 식별자 (구독 갱신 시 같은 행 upsert 위해)
const deviceId = () => {
  let id = localStorage.getItem('qh.device');
  if (!id) {
    id = (crypto.randomUUID?.() || String(Date.now() + Math.random()));
    localStorage.setItem('qh.device', id);
  }
  return id;
};

// 푸시 구독 + 서버 저장. 성공 시 true.
export const subscribePush = async () => {
  if (!pushSupported() || !VAPID_PUBLIC_KEY) return false;
  if (Notification.permission !== 'granted') {
    const p = await Notification.requestPermission();
    if (p !== 'granted') return false;
  }
  const reg = await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ||
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      device_id: deviceId(),
      subscription: sub.toJSON(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'device_id' }
  );
  if (error) {
    console.error('구독 저장 실패:', error);
    return false;
  }
  return true;
};

// 로컬 알람 설정 → 서버 동기화. Edge Function이 이 표를 보고 발송 대상을 정함.
// WHY: 알람 on/off는 localStorage라 서버가 모름 → 기기별로 현재 목록을 통째로 교체.
export const syncAlarms = async () => {
  if (!VAPID_PUBLIC_KEY) return;
  const dev = deviceId();
  const rows = listAlarms().map((a) => ({
    device_id: dev,
    ref_type: a.type,
    ref_id: a.id,
    days: a.days,
  }));
  // 기기 기준 전체 교체 (지운 항목 반영)
  await supabase.from('alarm_targets').delete().eq('device_id', dev);
  if (rows.length) await supabase.from('alarm_targets').insert(rows);
};

export const unsubscribePush = async () => {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) await sub.unsubscribe();
  await supabase.from('push_subscriptions').delete().eq('device_id', deviceId());
};
