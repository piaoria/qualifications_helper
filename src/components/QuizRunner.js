// 문제 풀이 진행기 — 한 문제씩 풀고 정답/해설 확인 → 결과
import { html, esc } from '../utils/dom.js';
import { Icon } from './Icon.js';

// questions: [{ id, category, question, choices[], answer_index, explanation }]
// onExit: 목록으로 돌아가는 콜백
export const QuizRunner = (questions, onExit) => {
  const root = html('<div class="quiz"></div>');
  let idx = 0;
  let score = 0;
  let answered = false;

  const renderResult = () => {
    const pct = Math.round((score / questions.length) * 100);
    root.replaceChildren(
      html(`
        <div class="quiz-result">
          <p class="quiz-result__score">${score} / ${questions.length}</p>
          <p class="quiz-result__pct">정답률 ${pct}%</p>
          <div class="quiz-result__actions">
            <button class="btn" data-retry>다시 풀기</button>
            <button class="btn btn--bookmark" data-exit aria-pressed="true">목록으로</button>
          </div>
        </div>
      `)
    );
    root.querySelector('[data-retry]').addEventListener('click', () => {
      idx = 0;
      score = 0;
      answered = false;
      render();
    });
    root.querySelector('[data-exit]').addEventListener('click', onExit);
  };

  const render = () => {
    if (idx >= questions.length) {
      renderResult();
      return;
    }
    answered = false;
    const q = questions[idx];
    const card = html(`
      <div class="quiz-card">
        <div class="quiz-card__top">
          <span class="quiz-card__count">${idx + 1} / ${questions.length}</span>
          ${q.category ? `<span class="badge badge--far">${esc(q.category)}</span>` : ''}
        </div>
        <p class="quiz-card__q">${esc(q.question)}</p>
        <div class="quiz-choices"></div>
        <div class="quiz-explain" hidden></div>
        <button class="btn quiz-next" hidden>다음</button>
      </div>
    `);

    const choicesEl = card.querySelector('.quiz-choices');
    const explainEl = card.querySelector('.quiz-explain');
    const nextBtn = card.querySelector('.quiz-next');

    (q.choices || []).forEach((choice, i) => {
      const btn = html(
        `<button class="quiz-choice"><span class="quiz-choice__num">${i + 1}</span><span>${esc(choice)}</span></button>`
      );
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const correct = i === q.answer_index;
        if (correct) score += 1;

        choicesEl.querySelectorAll('.quiz-choice').forEach((b, bi) => {
          b.disabled = true;
          if (bi === q.answer_index) b.classList.add('quiz-choice--correct');
          else if (bi === i) b.classList.add('quiz-choice--wrong');
        });

        explainEl.innerHTML =
          `<p class="quiz-explain__head">${correct ? '✅ 정답' : '❌ 오답'}</p>` +
          `<p>${esc(q.explanation)}</p>`;
        explainEl.hidden = false;
        nextBtn.hidden = false;
        nextBtn.textContent = idx + 1 >= questions.length ? '결과 보기' : '다음';
      });
      choicesEl.append(btn);
    });

    nextBtn.addEventListener('click', () => {
      idx += 1;
      render();
    });

    root.replaceChildren(card);
  };

  render();
  return root;
};
