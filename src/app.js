// 앱 진입점 — 하단 nav 라우팅
import { DashboardPage } from './pages/DashboardPage.js';
import { SchedulePage } from './pages/SchedulePage.js';
import { JobPage } from './pages/JobPage.js';
import { runLocalCheck } from './services/notifyService.js';
import { isPushActive } from './services/pushService.js';
import { getExamSchedules } from './services/certificationService.js';
import { getJobPostings } from './services/jobService.js';
import { openInbox } from './components/NotifyInbox.js';
import { unreadCount } from './utils/notifyStore.js';

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

// 알림함(🔔) — 헤더 버튼 + 안 읽음 뱃지
const bellBtn = document.getElementById('inbox-btn');
const badge = document.getElementById('inbox-badge');
const refreshBadge = async () => {
  try {
    const n = await unreadCount();
    badge.hidden = n === 0;
    badge.textContent = n > 9 ? '9+' : String(n);
  } catch {
    badge.hidden = true;
  }
};
bellBtn?.addEventListener('click', () => openInbox(refreshBadge));
refreshBadge();

// Service Worker 등록 (PWA 오프라인/설치)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) =>
      console.error('SW 등록 실패:', err)
    );
  });
}

// 로컬 알림(A) — 앱 열릴 때 임박 일정 검사. 권한 있을 때만 동작, 실패해도 앱엔 영향 없음.
// 단, 서버 푸시(B) 구독 중이면 같은 알림 중복이라 건너뜀.
window.addEventListener('load', async () => {
  try {
    if (await isPushActive()) return;
    const [exams, jobs] = await Promise.all([getExamSchedules(), getJobPostings()]);
    await runLocalCheck(exams, jobs);
    await refreshBadge();
  } catch (err) {
    console.error('로컬 알림 검사 실패:', err);
  }
});
