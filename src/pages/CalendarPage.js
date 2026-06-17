// 달력 렌더 — 월별 일정 + 날짜별 상세
// 이미 불러온 exams/jobs를 받아 root에 달력을 그린다 (일정 페이지에서 재사용).
import { html, esc } from '../utils/dom.js';
import { ymd, buildMonthGrid, examEvents, jobEvents, groupByDate } from '../utils/calendar.js';
import { Icon } from '../components/Icon.js';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const TYPE_LABEL = { exam: '시험', apply: '접수', result: '발표', job: '마감' };

export const mountCalendar = (root, exams, jobs) => {
  const byDate = groupByDate([...examEvents(exams), ...jobEvents(jobs)]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = ymd(today);

  let cur = new Date(today.getFullYear(), today.getMonth(), 1);
  let selected = todayStr;

  const render = () => {
    const y = cur.getFullYear();
    const m = cur.getMonth();
    const cells = buildMonthGrid(y, m);

    const weekRow = WEEKDAYS.map(
      (w, i) => `<div class="cal__wd ${i === 0 ? 'cal__wd--sun' : i === 6 ? 'cal__wd--sat' : ''}">${w}</div>`
    ).join('');

    const cellHtml = (cell) => {
      if (!cell) return '<div class="cal__cell cal__cell--blank"></div>';
      const ds = ymd(cell);
      const evs = byDate.get(ds) || [];
      const types = [...new Set(evs.map((e) => e.type))].slice(0, 4);
      const dots = types.map((t) => `<span class="dot dot--${t}"></span>`).join('');
      const cls = ['cal__cell'];
      if (ds === todayStr) cls.push('cal__cell--today');
      if (ds === selected) cls.push('cal__cell--selected');
      const dow = cell.getDay();
      const dcls = dow === 0 ? 'cal__num cal__num--sun' : dow === 6 ? 'cal__num cal__num--sat' : 'cal__num';
      return `<button class="${cls.join(' ')}" data-date="${ds}"><span class="${dcls}">${cell.getDate()}</span><span class="cal__dots">${dots}</span></button>`;
    };

    const selWd = WEEKDAYS[new Date(selected).getDay()];
    const dayEvs = byDate.get(selected) || [];
    const detail = dayEvs.length
      ? dayEvs
          .map(
            (ev) =>
              `<div class="ev"><span class="dot dot--${ev.type}"></span><span class="ev__tag">${TYPE_LABEL[ev.type] ?? ''}</span><span class="ev__label">${esc(ev.label)}</span></div>`
          )
          .join('')
      : '<p class="cal__none">일정이 없어요</p>';

    const cal = html(`
      <div class="cal">
        <div class="cal__bar">
          <button class="cal__nav" data-nav="-1" aria-label="이전 달">${Icon('chevronLeft', { size: 20 })}</button>
          <div class="cal__title">${y}년 ${m + 1}월</div>
          <button class="cal__nav" data-nav="1" aria-label="다음 달">${Icon('chevronRight', { size: 20 })}</button>
        </div>
        <div class="cal__grid cal__grid--wd">${weekRow}</div>
        <div class="cal__grid">${cells.map(cellHtml).join('')}</div>
        <div class="cal__legend">
          <span class="lg"><i class="dot dot--apply"></i>접수</span>
          <span class="lg"><i class="dot dot--exam"></i>시험</span>
          <span class="lg"><i class="dot dot--result"></i>발표</span>
          <span class="lg"><i class="dot dot--job"></i>마감</span>
          <button class="cal__today" data-today>오늘</button>
        </div>
        <div class="cal__detail">
          <h3 class="cal__detail-title">${selected.replaceAll('-', '.')} (${selWd})</h3>
          ${detail}
        </div>
      </div>
    `);

    const todayBtn = cal.querySelector('[data-today]');
    if (todayBtn)
      todayBtn.addEventListener('click', () => {
        cur = new Date(today.getFullYear(), today.getMonth(), 1);
        selected = todayStr;
        render();
      });

    cal.querySelectorAll('.cal__nav').forEach((btn) =>
      btn.addEventListener('click', () => {
        cur = new Date(y, m + Number(btn.dataset.nav), 1);
        render();
      })
    );
    cal.querySelectorAll('.cal__cell[data-date]').forEach((btn) =>
      btn.addEventListener('click', () => {
        selected = btn.dataset.date;
        render();
      })
    );

    root.replaceChildren(cal);
  };

  render();
};
