// 대시보드 — 임박한 일정 모아보기
import { html } from '../utils/dom.js';
import { daysUntil } from '../utils/date.js';
import { getExamSchedules } from '../services/certificationService.js';
import { getJobPostings } from '../services/jobService.js';
import { ExamItem } from '../components/ExamItem.js';
import { JobCard } from '../components/JobCard.js';
import { EmptyState, LoadingState, ErrorState } from '../components/EmptyState.js';
import { Icon } from '../components/Icon.js';

export const DashboardPage = async (mount) => {
  const view = html(`
    <section class="page">
      <h2 class="page__title">${Icon('bell')}<span>임박한 일정</span></h2>
      <div class="list" id="dash-list"></div>
    </section>
  `);
  const list = view.querySelector('#dash-list');
  list.append(LoadingState());
  mount.replaceChildren(view);

  try {
    const [exams, jobs] = await Promise.all([
      getExamSchedules(),
      getJobPostings(),
    ]);

    // 시험·공고를 D-day 기준 하나로 합쳐 정렬 (지난 것 제외)
    const items = [
      ...exams.map((e) => ({
        type: 'exam',
        date: e.written_exam_start || e.practical_exam_start,
        data: e,
      })),
      ...jobs.map((j) => ({ type: 'job', date: j.due_date, data: j })),
    ]
      .filter((i) => {
        const d = daysUntil(i.date);
        return d !== null && d >= 0;
      })
      .sort((a, b) => daysUntil(a.date) - daysUntil(b.date))
      .slice(0, 10);

    list.replaceChildren();
    if (items.length === 0) {
      list.append(EmptyState('다가오는 일정이 없어요'));
      return;
    }
    items.forEach((i) => {
      list.append(i.type === 'exam' ? ExamItem(i.data) : JobCard(i.data));
    });
  } catch (err) {
    list.replaceChildren(ErrorState('데이터를 불러오지 못했어요'));
    console.error(err);
  }
};
