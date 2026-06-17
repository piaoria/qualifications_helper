// 공고 탭 — 채용 공고 목록 (전체/관심 + 직무 필터, 총 개수, 최근 등록순)
import { html, esc } from '../utils/dom.js';
import { getJobPostings, toggleBookmark, hideJob } from '../services/jobService.js';
import { JobCard } from '../components/JobCard.js';
import { EmptyState, LoadingState, ErrorState } from '../components/EmptyState.js';
import { Icon } from '../components/Icon.js';
import { isPinned, togglePin } from '../services/pinService.js';

export const JobPage = async (mount) => {
  const view = html(`
    <section class="page">
      <h2 class="page__title">${Icon('briefcase')}<span>채용 공고</span></h2>
      <div class="seg" id="job-seg">
        <button class="seg__btn seg__btn--active" data-filter="all">전체</button>
        <button class="seg__btn" data-filter="bookmark">관심</button>
      </div>
      <div class="chips chips--scroll" id="job-cats"></div>
      <div class="job-meta">
        <span class="job-count" id="job-count"></span>
        <span class="job-sort">${Icon('clock', { size: 13 })}<span>최근 등록순</span></span>
      </div>
      <div class="list" id="job-list"></div>
    </section>
  `);
  const list = view.querySelector('#job-list');
  const seg = view.querySelector('#job-seg');
  const cats = view.querySelector('#job-cats');
  const countEl = view.querySelector('#job-count');
  list.append(LoadingState());
  mount.replaceChildren(view);

  let filter = 'all';
  let cat = '전체';
  let cache = null;

  const visible = () =>
    (cache || []).filter(
      (j) =>
        (filter === 'bookmark' ? j.is_bookmarked : true) &&
        (cat === '전체' ? true : j.job_category === cat)
    );

  const drawCats = () => {
    const names = ['전체', ...new Set((cache || []).map((j) => j.job_category).filter(Boolean))];
    cats.replaceChildren(
      ...names.map((c) => {
        const b = html(`<button class="chip ${c === cat ? 'chip--active' : ''}">${esc(c)}</button>`);
        b.addEventListener('click', () => {
          cat = c;
          cats.querySelectorAll('.chip').forEach((x) => x.classList.toggle('chip--active', x.textContent === cat));
          draw();
        });
        return b;
      })
    );
  };

  const draw = () => {
    const jobs = visible()
      .map((j) => ({ ...j, _pinned: isPinned('job', j.id) }))
      .sort((a, b) => (a._pinned === b._pinned ? 0 : a._pinned ? -1 : 1)); // 고정 우선
    countEl.textContent = `총 ${jobs.length}건`;
    list.replaceChildren();
    if (jobs.length === 0) {
      list.append(EmptyState(filter === 'bookmark' ? '관심 공고가 없어요' : '공고가 아직 없어요'));
      return;
    }
    jobs.forEach((j) =>
      list.append(
        JobCard(j, {
          onBookmark: async (id, v) => {
            await toggleBookmark(id, v);
            await load();
          },
          onHide: async (id) => {
            await hideJob(id);
            await load();
          },
          onPin: (id) => {
            togglePin('job', id);
            draw();
          },
        })
      )
    );
  };

  const load = async () => {
    try {
      cache = await getJobPostings();
      drawCats();
      draw();
    } catch (err) {
      list.replaceChildren(ErrorState('데이터를 불러오지 못했어요'));
      console.error(err);
    }
  };

  seg.querySelectorAll('.seg__btn').forEach((btn) =>
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      seg.querySelectorAll('.seg__btn').forEach((b) => b.classList.toggle('seg__btn--active', b === btn));
      draw();
    })
  );

  load();
};
