// Service Worker — 오프라인 캐시 (앱 셸) + 웹푸시
const CACHE = 'qh-v23';

// 최초 설치 시 미리 캐시할 앱 셸 (나머지는 런타임 캐시)
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './src/styles/main.css',
  './src/app.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Supabase API → 항상 네트워크 (최신 데이터, 캐시 안 함)
  if (url.hostname.endsWith('supabase.co')) return;

  // 동일 출처 정적 파일 → 캐시 우선, 없으면 네트워크 후 캐시 저장
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          }).catch(() => caches.match('./index.html'))
      )
    );
    return;
  }

  // 외부 CDN(esm.sh 등) → 네트워크 우선, 실패 시 캐시
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req))
  );
});

// 알림 기록 저장 (utils/notifyStore.js와 동일 DB — 클래식 SW라 import 불가해 인라인)
const logNotification = (entry) =>
  new Promise((resolve) => {
    const req = indexedDB.open('qh-notify', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('log')) {
        db.createObjectStore('log', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      const t = db.transaction('log', 'readwrite');
      t.objectStore('log').add({ read: 0, at: new Date().toISOString(), ...entry });
      t.oncomplete = () => resolve();
      t.onerror = () => resolve();
    };
    req.onerror = () => resolve();
  });

// 서버 푸시(B) 수신 → 시스템 알림 표시 + 기록
self.addEventListener('push', (e) => {
  let data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch {
    data = { title: '취준이', body: e.data ? e.data.text() : '' };
  }
  const title = data.title || '취준이';
  e.waitUntil(
    Promise.all([
      self.registration.showNotification(title, {
        body: data.body || '',
        icon: './icons/icon-192.png',
        badge: './icons/icon-192.png',
        tag: data.tag || 'qh-push',
        data: { url: data.url || './' },
      }),
      logNotification({ title, body: data.body || '', channel: 'push' }),
    ])
  );
});

// 알림 탭 → 앱 열기(이미 열려 있으면 포커스)
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
