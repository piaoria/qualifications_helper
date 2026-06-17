// 마스코트(안경 쓴 와들디) 픽셀아트 아이콘 PNG 생성 (의존성 없음, Node 내장 zlib)
// 32x32 그리드 → nearest-neighbor 업스케일.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const G = 32;

// 팔레트 (RGBA)
const TRANSPARENT = [0, 0, 0, 0]; // 배경 투명
const ORANGE = [233, 140, 64, 255];
const ORANGE_DK = [166, 82, 30, 255]; // 발
const BLACK = [32, 32, 29, 255];
const CHEEK = [240, 150, 140, 255];
const WHITE = [255, 253, 248, 255];

const grid = Array.from({ length: G }, () => Array.from({ length: G }, () => TRANSPARENT));
const setPx = (x, y, c) => {
  if (x >= 0 && x < G && y >= 0 && y < G) grid[y][x] = c;
};
const fillCircle = (cx, cy, r, c) => {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
      if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) setPx(x, y, c);
};
const fillEllipse = (cx, cy, rx, ry, c) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
      if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) setPx(x, y, c);
};
const fillRing = (cx, cy, rOut, rIn, c) => {
  for (let y = Math.floor(cy - rOut); y <= Math.ceil(cy + rOut); y++)
    for (let x = Math.floor(cx - rOut); x <= Math.ceil(cx + rOut); x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d <= rOut && d >= rIn) setPx(x, y, c);
    }
};
const drawLine = (x0, y0, x1, y1, r, c) => {
  const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 3);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    fillCircle(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, c);
  }
};

// ── 와들디 ──
// 동그란 몸통
fillCircle(16, 15, 9, ORANGE);
// 발 (더 크게, 윗부분이 얼굴 아래와 겹치도록 몸통 위 레이어)
fillEllipse(10.5, 23.5, 3.6, 2.4, ORANGE_DK);
fillEllipse(21.5, 23.5, 3.6, 2.4, ORANGE_DK);
// 볼터치
fillCircle(8.5, 17.5, 1.5, CHEEK);
fillCircle(23.5, 17.5, 1.5, CHEEK);
// 눈 (세로 검정 타원 + 흰 반짝임)
fillEllipse(12, 15, 1.5, 2.4, BLACK);
fillEllipse(20, 15, 1.5, 2.4, BLACK);
setPx(12, 13, WHITE);
setPx(20, 13, WHITE);
// 검정 동그라미 범생이 안경 (큰 알, 테두리만)
fillRing(12, 15, 4.0, 3.2, BLACK);
fillRing(20, 15, 4.0, 3.2, BLACK);
drawLine(15.6, 15, 16.4, 15, 0.5, BLACK); // 브릿지
drawLine(8, 15, 6.3, 14.4, 0.45, BLACK); // 다리 좌
drawLine(24, 15, 25.7, 14.4, 0.45, BLACK); // 다리 우

// ── PNG 인코딩 ──
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
};
const encodePng = (size) => {
  const scale = size / G;
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0;
    const gy = Math.floor(y / scale);
    for (let x = 0; x < size; x++) {
      const px = grid[gy][Math.floor(x / scale)];
      raw[p++] = px[0];
      raw[p++] = px[1];
      raw[p++] = px[2];
      raw[p++] = px[3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

mkdirSync('icons', { recursive: true });
writeFileSync('icons/icon-192.png', encodePng(192));
writeFileSync('icons/icon-512.png', encodePng(512));
console.log('안경 와들디 도트 아이콘 생성 완료');
