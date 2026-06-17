// 의존성 없는 도트(픽셀) 마스코트 생성기 — Claude 감성의 오리지널 캐릭터
// 16x16 논리 픽셀을 블록으로 확대해 PNG로 저장 (Node 내장 zlib만 사용)
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

// --- PNG 인코딩 (RGBA, 투명 지원) ---
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
  const idat = deflateSync(raw);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
};

// --- 16x16 도트 아트 ---
// 색 키:  ' ' 투명 / o 외곽선 / c 코랄 / l 하이라이트 / w 흰자 / k 눈동자 / m 입 / s 볼터치
const PALETTE = {
  o: [0xb5, 0x56, 0x3c, 255],
  c: [0xd9, 0x77, 0x57, 255],
  l: [0xe8, 0x9b, 0x82, 255],
  w: [0xff, 0xfd, 0xf7, 255],
  k: [0x2a, 0x20, 0x1c, 255],
  m: [0x8a, 0x3d, 0x28, 255],
  s: [0xef, 0xb0, 0x9c, 255],
};
// 별/스파크 느낌의 둥근 생명체 (눈 2개 + 미소 + 볼터치)
const ART = [
  '      oooo      ',
  '    ooccccoo    ',
  '   occcccccco   ',
  '  occllcccccco  ',
  ' occlllccccccco ',
  ' occcccccccccco ',
  ' occwkccccwkcco ',
  ' occwkccccwkcco ',
  ' occcccccccccco ',
  ' ocsccccccccsco ',
  ' occcmmmmmmccco ',
  '  occcmmmmcccо  '.replace('о', 'o'),
  '   occcccccco   ',
  '    ooccccoo    ',
  '      oooo      ',
  '                ',
];

const SCALE = 16; // 논리 픽셀당 블록 크기 → 16*16 = 256px
const W = 16, H = 16;
const out = Buffer.alloc(W * SCALE * H * SCALE * 4);
const put = (x, y, [r, g, b, a]) => {
  const i = (y * W * SCALE + x) * 4;
  out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = a;
};
for (let gy = 0; gy < H; gy++) {
  for (let gx = 0; gx < W; gx++) {
    const ch = ART[gy][gx];
    const color = PALETTE[ch] || [0, 0, 0, 0];
    for (let sy = 0; sy < SCALE; sy++)
      for (let sx = 0; sx < SCALE; sx++)
        put(gx * SCALE + sx, gy * SCALE + sy, color);
  }
}

mkdirSync('assets', { recursive: true });
writeFileSync('assets/mascot.png', png(W * SCALE, H * SCALE, out));
console.log('assets/mascot.png 생성 (256x256)');
