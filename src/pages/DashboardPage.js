// 대시보드 — 고정(핀) + 가장 임박 1건(히어로) + 다가오는 일정(compact)
import { html, esc } from '../utils/dom.js';
import { daysUntil, ddayLabel } from '../utils/date.js';
import { nextMilestone } from '../utils/exam.js';
import { getExamSchedules } from '../services/certificationService.js';
import { getJobPostings } from '../services/jobService.js';
import { isPinned, togglePin } from '../services/pinService.js';
import { DdayBadge } from '../components/DdayBadge.js';
import { EmptyState, LoadingState, ErrorState } from '../components/EmptyState.js';
import { Icon } from '../components/Icon.js';

// 원시 항목 → 표시용 정규화 (+ 고정 여부)
const toItem = (raw) => {
  const it =
    raw.type === 'exam'
      ? {
          type: 'exam',
          id: raw.data.id,
          date: nextMilestone(raw.data)?.date ?? null,
          name: raw.data.certifications?.name ?? '자격증',
          sub: nextMilestone(raw.data)?.label ?? '',
          suffix: ' 까지',
          icon: 'cap',
          tag: '자격증',
          url: null,
        }
      : {
          type: 'job',
          id: raw.data.id,
          date: raw.data.due_date,
          name: raw.data.company_name ?? '공고',
          sub: raw.data.position ?? '',
          suffix: '',
          icon: 'briefcase',
          tag: '공고',
          url: raw.data.url ?? null,
        };
  it._pinned = isPinned(it.type, it.id);
  return it;
};

const Hero = (it, onPin) => {
  const soon = (daysUntil(it.date) ?? 99) <= 3;
  const inner = `
    <div class="hero__info">
      <div class="hero__tagrow">
        <span class="hero__tag">${Icon(it.icon, { size: 14 })}<span>${it.tag}</span></span>
        <button class="pin ${it._pinned ? 'pin--on' : ''}" data-pin>${it._pinned ? '고정됨' : '고정'}</button>
      </div>
      <h3 class="hero__title">${esc(it.name)}</h3>
      <p class="hero__sub">${esc(it.sub)}${it.sub ? it.suffix : ''}</p>
    </div>
    <div class="hero__dday ${soon ? 'hero__dday--soon' : ''}">${ddayLabel(it.date)}</div>`;
  const el = it.url
    ? html(`<a class="hero" href="${esc(it.url)}" target="_blank" rel="noopener">${inner}</a>`)
    : html(`<article class="hero">${inner}</article>`);
  el.querySelector('[data-pin]').addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    onPin(it);
  });
  return el;
};

const Row = (it, onPin) => {
  const inner = `
    <span class="up__icon">${Icon(it.icon, { size: 16 })}</span>
    <div class="up__body">
      <span class="up__title">${esc(it.name)}</span>
      <span class="up__sub">${esc(it.sub)}</span>
    </div>
    <button class="pin ${it._pinned ? 'pin--on' : ''}" data-pin>${it._pinned ? '고정됨' : '고정'}</button>
    ${DdayBadge(it.date)}`;
  const cls = `up ${it._pinned ? 'up--pinned' : ''}`;
  const el = it.url
    ? html(`<a class="${cls}" href="${esc(it.url)}" target="_blank" rel="noopener">${inner}</a>`)
    : html(`<div class="${cls}">${inner}</div>`);
  el.querySelector('[data-pin]').addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    onPin(it);
  });
  return el;
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

  let exams = [];
  let jobs = [];
  try {
    [exams, jobs] = await Promise.all([getExamSchedules(), getJobPostings()]);
  } catch (err) {
    body.replaceChildren(ErrorState('데이터를 불러오지 못했어요'));
    console.error(err);
    return;
  }

  const byDate = (a, b) => {
    const da = daysUntil(a.date);
    const db = daysUntil(b.date);
    if (da === null && db === null) return 0;
    if (da === null) return 1;
    if (db === null) return -1;
    return da - db;
  };

  const onPin = (it) => {
    togglePin(it.type, it.id);
    render();
  };

  const section = (title, items, count) => {
    const sec = html(`
      <div class="dash-sec">
        <h3 class="dash-sec__title">${title}${count ? ` <span class="dash-sec__count">${items.length}</span>` : ''}</h3>
        <div class="up-list"></div>
      </div>
    `);
    const ul = sec.querySelector('.up-list');
    items.forEach((it) => ul.append(Row(it, onPin)));
    return sec;
  };

  const render = () => {
    const all = [
      ...exams.map((e) => ({ type: 'exam', data: e })),
      ...jobs.map((j) => ({ type: 'job', data: j })),
    ].map(toItem);

    const pinned = all.filter((it) => it._pinned).sort(byDate);
    const upcoming = all
      .filter((it) => !it._pinned && daysUntil(it.date) !== null && daysUntil(it.date) >= 0)
      .sort(byDate);

    body.replaceChildren();

    if (!pinned.length && !upcoming.length) {
      body.append(EmptyState('고정하거나 다가오는 일정이 없어요'));
      return;
    }

    // 메인 = 내가 고정한 것 우선 (없으면 가장 임박한 것)
    if (pinned.length) {
      body.append(Hero(pinned[0], onPin));
      if (pinned.length > 1) body.append(section('고정', pinned.slice(1)));
      if (upcoming.length) body.append(section('다가오는 일정', upcoming.slice(0, 6), true));
    } else {
      body.append(Hero(upcoming[0], onPin));
      const rest = upcoming.slice(1, 8);
      if (rest.length) body.append(section('다가오는 일정', rest, true));
    }
  };

  render();
};
