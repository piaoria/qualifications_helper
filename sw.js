// Service Worker — 오프라인 캐시 (앱 셸)
const CACHE = 'qh-v11';

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
