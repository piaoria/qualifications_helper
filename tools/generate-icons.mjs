// 의존성 없이 PWA 아이콘 PNG 생성 (Node 내장 zlib만 사용)
// 모티프: 어두운 배경 + 밝은 패널 + 일정 리스트 바 3개
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

// --- PNG 인코딩 유틸 ---
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
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
};

const png = (w, h, rgba) => {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, y * w * 4 + w * 4);
  }
  const idat = deflateSync(raw);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
};

// --- 아이콘 그리기 ---
const inRoundRect = (x, y, x0, y0, x1, y1, rad) => {
  if (x < x0 || x >= x1 || y < y0 || y >= y1) return false;
  let cx = null, cy = null;
  if (x < x0 + rad && y < y0 + rad) { cx = x0 + rad; cy = y0 + rad; }
  else if (x >= x1 - rad && y < y0 + rad) { cx = x1 - 1 - rad; cy = y0 + rad; }
  else if (x < x0 + rad && y >= y1 - rad) { cx = x0 + rad; cy = y1 - 1 - rad; }
  else if (x >= x1 - rad && y >= y1 - rad) { cx = x1 - 1 - rad; cy = y1 - 1 - rad; }
  if (cx !== null) {
    const dx = x - cx, dy = y - cy;
    return dx * dx + dy * dy <= rad * rad;
  }
  return true;
};

const makeIcon = (size) => {
  const px = Buffer.alloc(size * size * 4);
  const set = (x, y, r, g, b) => {
    const i = (y * size + x) * 4;
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
  };

  // 배경
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) set(x, y, 0x22, 0x22, 0x22);

  // 패널 (밝은 라운드 사각형, 마스커블 안전영역 고려해 22% 여백)
  const m = Math.round(size * 0.22);
  const x0 = m, y0 = m, x1 = size - m, y1 = size - m;
  const rad = Math.round(size * 0.07);
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++)
      if (inRoundRect(x, y, x0, y0, x1, y1, rad)) set(x, y, 0xf4, 0xf4, 0xf4);

  // 리스트 바 3개 (첫 줄 강조색)
  const pw = x1 - x0;
  const bx = x0 + Math.round(pw * 0.15);
  const bw = [0.62, 0.5, 0.42].map((r) => Math.round(pw * r));
  const bh = Math.round(size * 0.05);
  const gap = Math.round(size * 0.105);
  const by0 = y0 + Math.round(pw * 0.22);
  const colors = [[0xd9, 0x48, 0x0f], [0xaa, 0xaa, 0xaa], [0xaa, 0xaa, 0xaa]];
  for (let k = 0; k < 3; k++) {
    const by = by0 + k * gap;
    for (let y = by; y < by + bh; y++)
      for (let x = bx; x < bx + bw[k]; x++) set(x, y, ...colors[k]);
  }

  return png(size, size, px);
};

mkdirSync('icons', { recursive: true });
for (const size of [192, 512]) {
  writeFileSync(`icons/icon-${size}.png`, makeIcon(size));
  console.log(`icons/icon-${size}.png 생성`);
}
