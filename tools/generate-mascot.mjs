// 의존성 없는 도트 마스코트 생성기 — 미니멀 버전
// 둥근 네모 + 점 눈 2개. 적은 도트로 표현 (Claude 감성)
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

// --- PNG 인코딩 ---
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
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
};
const png = (w, h, rgba) => {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, y * w * 4 + w * 4);
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
};

// --- 미니멀 도트 아트 (12x12 논리 그리드) ---
const G = 12;
const SCALE = 20;            // 12*20 = 240px
const CORAL = [0xd9, 0x77, 0x57, 255];
const EYE = [0x2a, 0x20, 0x1c, 255];

// 둥근 네모 판정 (모서리 한 칸씩 깎음)
const inBody = (x, y) => {
  if (x < 1 || x > 10 || y < 1 || y > 10) return false;
  // 네 모서리 1칸 컷
  if ((x === 1 || x === 10) && (y === 1 || y === 10)) return false;
  return true;
};

// 눈 위치 (2x2 블록 두 개)
const isEye = (x, y) =>
  (y === 5 || y === 6) && ((x === 4 || x === 3) || (x === 7 || x === 8))
    ? (x === 3 || x === 4 || x === 7 || x === 8)
    : false;

const W = G * SCALE, H = G * SCALE;
const out = Buffer.alloc(W * H * 4);
const put = (x, y, [r, g, b, a]) => {
  const i = (y * W + x) * 4;
  out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = a;
};

for (let gy = 0; gy < G; gy++) {
  for (let gx = 0; gx < G; gx++) {
    let color = [0, 0, 0, 0];
    if (inBody(gx, gy)) color = isEye(gx, gy) ? EYE : CORAL;
    for (let sy = 0; sy < SCALE; sy++)
      for (let sx = 0; sx < SCALE; sx++)
        put(gx * SCALE + sx, gy * SCALE + sy, color);
  }
}

mkdirSync('assets', { recursive: true });
writeFileSync('assets/mascot.png', png(W, H, out));
console.log(`assets/mascot.png 생성 (${W}x${H})`);
