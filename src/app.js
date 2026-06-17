// 앱 진입점 — 탭 라우팅
import { DashboardPage } from './pages/DashboardPage.js';
import { CalendarPage } from './pages/CalendarPage.js';
import { ExamPage } from './pages/ExamPage.js';
import { JobPage } from './pages/JobPage.js';

const routes = {
  dashboard: DashboardPage,
  calendar: CalendarPage,
  jobs: JobPage,
  exams: ExamPage,
};

const view = document.getElementById('view');
const tabs = document.querySelectorAll('.tab');

const navigate = (name) => {
  tabs.forEach((t) =>
    t.classList.toggle('tab--active', t.dataset.route === name)
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
