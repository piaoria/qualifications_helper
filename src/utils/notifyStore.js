// 알림 기록 저장소 — IndexedDB.
// WHY: A(로컬,페이지)와 B(푸시,SW)가 같은 기록을 써야 하는데 SW는 localStorage 접근 불가.
//      IndexedDB는 페이지·SW 양쪽에서 접근 가능 → 통합 알림함의 단일 출처.
// 같은 DB 정의가 sw.js에도 인라인돼 있음(클래식 SW라 import 불가). 변경 시 함께 수정.
const DB = 'qh-notify';
const STORE = 'log';
const VERSION = 1;

const open = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const tx = async (mode, fn) => {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    const out = fn(store);
    t.oncomplete = () => resolve(out);
    t.onerror = () => reject(t.error);
  });
};

// entry: { title, body, at(ISO), type, refId, channel } — read는 0으로 시작
export const addLog = (entry) =>
  tx('readwrite', (s) => s.add({ read: 0, at: new Date().toISOString(), ...entry }));

// 최신순 배열
export const getLogs = () =>
  new Promise(async (resolve, reject) => {
    try {
      const db = await open();
      const s = db.transaction(STORE).objectStore(STORE);
      const req = s.getAll();
      req.onsuccess = () =>
        resolve([...req.result].sort((a, b) => (a.at < b.at ? 1 : -1)));
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });

export const unreadCount = async () =>
  (await getLogs()).filter((l) => !l.read).length;

export const markAllRead = async () => {
  const logs = await getLogs();
  return tx('readwrite', (s) => logs.forEach((l) => l.read || s.put({ ...l, read: 1 })));
};

export const clearLogs = () => tx('readwrite', (s) => s.clear());
