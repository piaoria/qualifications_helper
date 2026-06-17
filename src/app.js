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

const navigate = (name) => {
  tabs.forEach((t) =>
    t.classList.toggle('navbtn--active', t.dataset.route === name)
  );
  (routes[name] ?? DashboardPage)(view);
};

tabs.forEach((tab) =>
  tab.addEventListener('click', () => navigate(tab.dataset.route))
);

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
