// 공고 탭 — 채용 공고 목록
import { html } from '../utils/dom.js';
import { getJobPostings, toggleBookmark, hideJob } from '../services/jobService.js';
import { JobCard } from '../components/JobCard.js';
import { EmptyState, LoadingState, ErrorState } from '../components/EmptyState.js';
import { Icon } from '../components/Icon.js';

export const JobPage = async (mount) => {
  const view = html(`
    <section class="page">
      <h2 class="page__title">${Icon('briefcase')}<span>채용 공고</span></h2>
      <div class="list" id="job-list"></div>
    </section>
  `);
  const list = view.querySelector('#job-list');
  list.append(LoadingState());
  mount.replaceChildren(view);

  const render = async () => {
    try {
      const jobs = await getJobPostings();
      list.replaceChildren();
      if (jobs.length === 0) {
        list.append(EmptyState('공고가 아직 없어요\n(원티드 수집 연결 예정)'));
        return;
      }
      jobs.forEach((j) =>
        list.append(
          JobCard(j, {
            onBookmark: async (id, v) => {
              await toggleBookmark(id, v);
              render();
            },
            onHide: async (id) => {
              await hideJob(id);
              render();
            },
          })
        )
      );
    } catch (err) {
      list.replaceChildren(ErrorState('데이터를 불러오지 못했어요'));
      console.error(err);
    }
  };

  render();
};
