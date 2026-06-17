// 일정 탭 — 자격증 단계 타임라인 + 달력 (세그먼트 전환)
import { html, esc } from '../utils/dom.js';
import { Icon } from '../components/Icon.js';
import { EmptyState, LoadingState, ErrorState } from '../components/EmptyState.js';
import { DdayBadge } from '../components/DdayBadge.js';
import { CertTimeline } from '../components/CertTimeline.js';
import { getExamSchedules } from '../services/certificationService.js';
import { getJobPostings } from '../services/jobService.js';
import { mountCalendar } from './CalendarPage.js';

export const SchedulePage = async (mount) => {
  const view = html(`
    <section class="page">
      <h2 class="page__title">${Icon('calendar')}<span>일정</span></h2>
      <div class="seg" id="sched-seg">
        <button class="seg__btn seg__btn--active" data-seg="timeline">타임라인</button>
        <button class="seg__btn" data-seg="calendar">달력</button>
      </div>
      <div id="sched-body"></div>
    </section>
  `);
  const body = view.querySelector('#sched-body');
  body.append(LoadingState());
  mount.replaceChildren(view);

  let exams = [];
  let jobs = [];
  try {
    [exams, jobs] = await Promise.all([getExamSchedules(), getJobPostings()]);
  } catch (err) {
    body.replaceChildren(ErrorState('데이터를 불러오지 못했어요'));
    console.error(err);
    return;
  }

  let seg = 'timeline';

  const renderTimeline = () => {
    if (!exams.length) {
      body.replaceChildren(EmptyState('시험 일정이 아직 없어요'));
      return;
    }
    const list = html('<div class="list"></div>');
    exams.forEach((e) => {
      const name = e.certifications?.name ?? '자격증';
      const next = e.written_exam_start || e.practical_exam_start || null;
      const card = html(`
        <article class="card card--exam">
          <header class="card__head">
            <h3 class="card__title">${esc(name)}</h3>
            ${DdayBadge(next)}
          </header>
          <p class="card__round">${esc(e.round || '')}</p>
        </article>
      `);
      card.append(CertTimeline(e));
      list.append(card);
    });
    body.replaceChildren(list);
  };

  const renderBody = () => {
    if (seg === 'calendar') {
      body.replaceChildren();
      mountCalendar(body, exams, jobs);
    } else {
      renderTimeline();
    }
  };

  view.querySelectorAll('.seg__btn').forEach((btn) =>
    btn.addEventListener('click', () => {
      seg = btn.dataset.seg;
      view.querySelectorAll('.seg__btn').forEach((b) =>
        b.classList.toggle('seg__btn--active', b.dataset.seg === seg)
      );
      renderBody();
    })
  );

  renderBody();
};
