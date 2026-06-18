// 알림함 — 받은 알림 기록을 다시 확인하는 바텀시트.
import { html, esc } from '../utils/dom.js';
import { Icon } from './Icon.js';
import { getLogs, markAllRead, clearLogs } from '../utils/notifyStore.js';

// ISO → "방금 / N분 전 / N시간 전 / M.D"
const relTime = (iso) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return '방금';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  const d = new Date(iso);
  return `${d.getMonth() + 1}.${d.getDate()}`;
};

// 열기. onClose: 닫힐 때 호출(뱃지 갱신용).
export const openInbox = async (onClose) => {
  const overlay = html(`
    <div class="sheet-wrap" role="dialog" aria-label="알림함">
      <div class="sheet-dim"></div>
      <div class="sheet">
        <header class="sheet__head">
          <strong>알림함</strong>
          <div class="sheet__head-actions">
            <button class="sheet__clear" type="button">모두 지우기</button>
            <button class="sheet__close" type="button" aria-label="닫기">${Icon('x', { size: 18 })}</button>
          </div>
        </header>
        <div class="sheet__body" id="inbox-body"></div>
      </div>
    </div>
  `);
  document.body.append(overlay);

  const body = overlay.querySelector('#inbox-body');
  const render = async () => {
    const logs = await getLogs();
    if (!logs.length) {
      body.replaceChildren(
        html(`<p class="inbox-empty">${Icon('bell', { size: 28 })}<span>받은 알림이 없어요</span></p>`)
      );
      return;
    }
    const list = html('<ul class="inbox-list"></ul>');
    logs.forEach((l) => {
      const [title, sub] = (l.body || '').split('\n');
      list.append(
        html(`
          <li class="inbox-item ${l.read ? '' : 'inbox-item--unread'}">
            <span class="inbox-item__dot"></span>
            <div class="inbox-item__main">
              <p class="inbox-item__title">${esc(title || l.title || '알림')}</p>
              ${sub ? `<p class="inbox-item__sub">${esc(sub)}</p>` : ''}
            </div>
            <time class="inbox-item__time">${relTime(l.at)}</time>
          </li>
        `)
      );
    });
    body.replaceChildren(list);
  };
  await render();

  const close = async () => {
    await markAllRead(); // 닫을 때 읽음 처리
    overlay.remove();
    onClose?.();
  };
  overlay.querySelector('.sheet-dim').addEventListener('click', close);
  overlay.querySelector('.sheet__close').addEventListener('click', close);
  overlay.querySelector('.sheet__clear').addEventListener('click', async () => {
    await clearLogs();
    await render();
  });
};
