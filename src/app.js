// 앱 진입점 — 하단 nav 라우팅
import { DashboardPage } from './pages/DashboardPage.js';
import { SchedulePage } from './pages/SchedulePage.js';
import { JobPage } from './pages/JobPage.js';

const routes = {
  dashboard: DashboardPage,
  schedule: SchedulePage,
  jobs: JobPage,
};

const view = document.getElementById('view');
const tabs = document.querySelectorAll('.navbtn');
const ORDER = ['dashboard', 'schedule', 'jobs'];
let current = 'dashboard';

const navigate = (name) => {
  current = routes[name] ? name : 'dashboard';
  tabs.forEach((t) =>
    t.classList.toggle('navbtn--active', t.dataset.route === current)
  );
  (routes[current] ?? DashboardPage)(view);
};

tabs.forEach((tab) =>
  tab.addEventListener('click', () => navigate(tab.dataset.route))
);

// 좌우 스와이프로 탭 이동 (가로 제스처만 인식, 세로 스크롤과 충돌 방지)
let sx = null;
let sy = null;
view.addEventListener('touchstart', (e) => {
  const t = e.changedTouches[0];
  sx = t.clientX;
  sy = t.clientY;
}, { passive: true });
view.addEventListener('touchend', (e) => {
  if (sx === null) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - sx;
  const dy = t.clientY - sy;
  sx = null;
  if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
  const i = ORDER.indexOf(current);
  const next = dx < 0 ? i + 1 : i - 1;
  if (next >= 0 && next < ORDER.length) navigate(ORDER[next]);
}, { passive: true });

// 초기 화면
navigate('dashboard');

// Service Worker 등록 (PWA 오프라인/설치)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) =>
      console.error('SW 등록 실패:', err)
    );
  });
}
