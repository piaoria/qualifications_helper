// 공고 탭 — 채용 공고 목록 (전체/관심 필터)
import { html } from '../utils/dom.js';
import { getJobPostings, toggleBookmark, hideJob } from '../services/jobService.js';
import { JobCard } from '../components/JobCard.js';
import { EmptyState, LoadingState, ErrorState } from '../components/EmptyState.js';
import { Icon } from '../components/Icon.js';

export const JobPage = async (mount) => {
  const view = html(`
    <section class="page">
      <h2 class="page__title">${Icon('briefcase')}<span>채용 공고</span></h2>
      <div class="seg" id="job-seg">
        <button class="seg__btn seg__btn--active" data-filter="all">전체</button>
        <button class="seg__btn" data-filter="bookmark">관심</button>
      </div>
      <div class="list" id="job-list"></div>
    </section>
  `);
  const list = view.querySelector('#job-list');
  const seg = view.querySelector('#job-seg');
  list.append(LoadingState());
  mount.replaceChildren(view);

  let filter = 'all';
  let cache = null;

  const draw = () => {
    const jobs = (cache || []).filter((j) => (filter === 'bookmark' ? j.is_bookmarked : true));
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
        })
      )
    );
  };

  const load = async () => {
    try {
      cache = await getJobPostings();
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
