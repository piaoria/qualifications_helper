// 자격증 탭 — 종목 목록 + 시험 일정
import { html } from '../utils/dom.js';
import { esc } from '../utils/dom.js';
import { getCertifications, getExamSchedules } from '../services/certificationService.js';
import { ExamItem } from '../components/ExamItem.js';
import { EmptyState, LoadingState, ErrorState } from '../components/EmptyState.js';
import { Icon } from '../components/Icon.js';

export const ExamPage = async (mount) => {
  const view = html(`
    <section class="page">
      <h2 class="page__title">${Icon('cap')}<span>자격증</span></h2>
      <div class="chips" id="cert-chips"></div>
      <div class="list" id="exam-list"></div>
    </section>
  `);
  const chips = view.querySelector('#cert-chips');
  const list = view.querySelector('#exam-list');
  list.append(LoadingState());
  mount.replaceChildren(view);

  try {
    const [certs, exams] = await Promise.all([
      getCertifications(),
      getExamSchedules(),
    ]);

    // 추적 종목 칩
    chips.replaceChildren(
      ...certs.map((c) => html(`<span class="chip">${esc(c.name)}</span>`))
    );

    list.replaceChildren();
    if (exams.length === 0) {
      list.append(EmptyState('시험 일정이 아직 없어요\n(수집 스크립트 연결 예정)'));
      return;
    }
    exams.forEach((e) => list.append(ExamItem(e)));
  } catch (err) {
    list.replaceChildren(ErrorState('데이터를 불러오지 못했어요'));
    console.error(err);
  }
};
