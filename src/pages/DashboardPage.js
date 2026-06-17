// 대시보드 — 가장 임박한 1건(히어로) + 다가오는 일정(compact 목록)
import { html, esc } from '../utils/dom.js';
import { daysUntil, ddayLabel } from '../utils/date.js';
import { nextMilestone } from '../utils/exam.js';
import { getExamSchedules } from '../services/certificationService.js';
import { getJobPostings } from '../services/jobService.js';
import { DdayBadge } from '../components/DdayBadge.js';
import { EmptyState, LoadingState, ErrorState } from '../components/EmptyState.js';
import { Icon } from '../components/Icon.js';

// 원시 항목 → 표시용 정규화
const toItem = (raw) =>
  raw.type === 'exam'
    ? {
        date: raw.date,
        name: raw.data.certifications?.name ?? '자격증',
        sub: nextMilestone(raw.data)?.label ?? '',
        icon: 'cap',
        tag: '자격증',
        url: null,
      }
    : {
        date: raw.date,
        name: raw.data.company_name ?? '공고',
        sub: raw.data.position ?? '',
        icon: 'briefcase',
        tag: '공고',
        url: raw.data.url ?? null,
      };

// 가장 임박 1건 — 큰 히어로
const Hero = (it) => {
  const soon = (daysUntil(it.date) ?? 99) <= 3;
  const inner = `
    <div class="hero__top">
      <span class="hero__tag">${Icon(it.icon, { size: 14 })}<span>${it.tag}</span></span>
      <span class="hero__dday ${soon ? 'hero__dday--soon' : ''}">${ddayLabel(it.date)}</span>
    </div>
    <h3 class="hero__title">${esc(it.name)}</h3>
    <p class="hero__sub">${esc(it.sub)}</p>`;
  return it.url
    ? html(`<a class="hero" href="${esc(it.url)}" target="_blank" rel="noopener">${inner}</a>`)
    : html(`<article class="hero">${inner}</article>`);
};

// 나머지 — 한 줄 compact
const Row = (it) => {
  const inner = `
    <span class="up__icon">${Icon(it.icon, { size: 16 })}</span>
    <div class="up__body">
      <span class="up__title">${esc(it.name)}</span>
      <span class="up__sub">${esc(it.sub)}</span>
    </div>
    ${DdayBadge(it.date)}`;
  return it.url
    ? html(`<a class="up" href="${esc(it.url)}" target="_blank" rel="noopener">${inner}</a>`)
    : html(`<div class="up">${inner}</div>`);
};

export const DashboardPage = async (mount) => {
  const view = html(`
    <section class="page">
      <h2 class="page__title">${Icon('bell')}<span>임박한 일정</span></h2>
      <div id="dash-body"></div>
    </section>
  `);
  const body = view.querySelector('#dash-body');
  body.append(LoadingState());
  mount.replaceChildren(view);

  try {
    const [exams, jobs] = await Promise.all([getExamSchedules(), getJobPostings()]);

    const items = [
      ...exams.map((e) => ({ type: 'exam', date: nextMilestone(e)?.date ?? null, data: e })),
      ...jobs.map((j) => ({ type: 'job', date: j.due_date, data: j })),
    ]
      .filter((i) => {
        const d = daysUntil(i.date);
        return d !== null && d >= 0;
      })
      .sort((a, b) => daysUntil(a.date) - daysUntil(b.date))
      .map(toItem);

    body.replaceChildren();
    if (items.length === 0) {
      body.append(EmptyState('다가오는 일정이 없어요'));
      return;
    }

    body.append(Hero(items[0]));

    const rest = items.slice(1, 8);
    if (rest.length) {
      const sec = html(`
        <div class="dash-sec">
          <h3 class="dash-sec__title">다가오는 일정 <span class="dash-sec__count">${rest.length}</span></h3>
          <div class="up-list"></div>
        </div>
      `);
      const ul = sec.querySelector('.up-list');
      rest.forEach((it) => ul.append(Row(it)));
      body.append(sec);
    }
  } catch (err) {
    body.replaceChildren(ErrorState('데이터를 불러오지 못했어요'));
    console.error(err);
  }
};
