// 학습 탭 — 종목·유형(필기/실기) 선택 → 문제 풀이
import { html, esc } from '../utils/dom.js';
import { Icon } from '../components/Icon.js';
import { EmptyState, LoadingState, ErrorState } from '../components/EmptyState.js';
import { QuizRunner } from '../components/QuizRunner.js';
import { getQuizSummary, getQuizQuestions } from '../services/quizService.js';

const QUIZ_LIMIT = 10; // 한 세트 문제 수

export const QuizPage = async (mount) => {
  const view = html(`
    <section class="page">
      <h2 class="page__title">${Icon('quiz')}<span>학습</span></h2>
      <div id="quiz-body"></div>
    </section>
  `);
  const body = view.querySelector('#quiz-body');
  body.append(LoadingState());
  mount.replaceChildren(view);

  let summary = [];
  try {
    summary = await getQuizSummary();
  } catch (err) {
    body.replaceChildren(ErrorState('문제를 불러오지 못했어요'));
    console.error(err);
    return;
  }

  const renderList = () => {
    if (!summary.length) {
      body.replaceChildren(EmptyState('아직 등록된 문제가 없어요'));
      return;
    }
    const list = html('<div class="list"></div>');
    summary.forEach((c) => {
      const card = html(`
        <article class="card">
          <header class="card__head">
            <h3 class="card__title">${esc(c.name)}</h3>
          </header>
          <div class="quiz-pick"></div>
        </article>
      `);
      const pick = card.querySelector('.quiz-pick');
      [
        { key: 'written', label: '필기', n: c.written },
        { key: 'practical', label: '실기', n: c.practical },
      ].forEach(({ key, label, n }) => {
        const btn = html(
          `<button class="btn quiz-type" ${n ? '' : 'disabled'}>${label}<span class="quiz-type__n">${n}</span></button>`
        );
        if (n) btn.addEventListener('click', () => startQuiz(c, key, label));
        pick.append(btn);
      });
      list.append(card);
    });
    body.replaceChildren(list);
  };

  const startQuiz = async (cert, examType, label) => {
    body.replaceChildren(LoadingState(1));
    let questions = [];
    try {
      questions = await getQuizQuestions(cert.id, examType, QUIZ_LIMIT);
    } catch (err) {
      body.replaceChildren(ErrorState('문제를 불러오지 못했어요'));
      console.error(err);
      return;
    }
    if (!questions.length) {
      body.replaceChildren(EmptyState('이 유형은 아직 문제가 없어요'));
      return;
    }
    const header = html(`
      <div class="quiz-head">
        <button class="quiz-back" aria-label="목록으로">${Icon('chevronLeft')}</button>
        <span>${esc(cert.name)} · ${label}</span>
      </div>
    `);
    header.querySelector('.quiz-back').addEventListener('click', renderList);
    body.replaceChildren(header, QuizRunner(questions, renderList));
  };

  renderList();
};
