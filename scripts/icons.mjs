// Generates every logo and icon size from the SVG mark.
// Run when the mark changes: npm i --no-save sharp && node scripts/icons.mjs
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(join(pub, 'brand'), { recursive: true });

const rows = (s = 1, dx = 0, dy = 0) => `
  <circle cx="${dx + 9.5 * s}" cy="${dy + 10 * s}" r="${2.4 * s}" fill="#16A36A"/>
  <rect x="${dx + 14 * s}" y="${dy + 8.6 * s}" width="${11 * s}" height="${2.8 * s}" rx="${1.4 * s}" fill="#FFFFFF"/>
  <circle cx="${dx + 9.5 * s}" cy="${dy + 16 * s}" r="${2.4 * s}" fill="#16A36A"/>
  <rect x="${dx + 14 * s}" y="${dy + 14.6 * s}" width="${8 * s}" height="${2.8 * s}" rx="${1.4 * s}" fill="#FFFFFF"/>
  <circle cx="${dx + 9.5 * s}" cy="${dy + 22 * s}" r="${2.4 * s}" fill="#F5A524"/>
  <rect x="${dx + 14 * s}" y="${dy + 20.6 * s}" width="${10 * s}" height="${2.8 * s}" rx="${1.4 * s}" fill="#FFFFFF"/>`;

// Rounded mark (favicons, in-app)
const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#14213D"/>${rows()}</svg>`;
// Full-bleed square (iOS and Android apply their own mask)
const square = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#14213D"/>${rows()}</svg>`;
// Maskable: content inside the 80% safe zone
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#14213D"/>${rows(1, 4, 4)}</svg>`;

const wordmark = (ink, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 236 40" width="236" height="40">
  ${bg ? `<rect width="236" height="40" fill="${bg}"/>` : ''}
  <g transform="translate(4 4)"><rect width="32" height="32" rx="8" fill="#14213D"/>${rows()}</g>
  <text x="48" y="28" font-family="'Schibsted Grotesk','Helvetica Neue',Arial,sans-serif" font-weight="700" font-size="22" letter-spacing="-0.4" fill="${ink}">KriosityOps</text>
</svg>`;

writeFileSync(join(pub, 'favicon.svg'), mark);
writeFileSync(join(pub, 'brand', 'kriosityops-mark.svg'), mark);
writeFileSync(join(pub, 'brand', 'kriosityops-logo.svg'), wordmark('#14213D'));
writeFileSync(join(pub, 'brand', 'kriosityops-logo-white.svg'), wordmark('#FFFFFF'));

const png = (svg, size, file) => sharp(Buffer.from(svg), { density: 1200 }).resize(size, size).png().toFile(join(pub, file));

const tasks = [
  [mark, 16, 'favicon-16x16.png'],
  [mark, 32, 'favicon-32x32.png'],
  [mark, 48, 'favicon-48x48.png'],
  [square, 180, 'apple-touch-icon.png'],
  [mark, 192, 'icon-192.png'],
  [mark, 512, 'icon-512.png'],
  [maskable, 512, 'icon-maskable-512.png'],
  [mark, 1024, 'brand/kriosityops-mark-1024.png'],
  [mark, 256, 'brand/kriosityops-mark-256.png'],
];
for (const [svg, size, file] of tasks) await png(svg, size, file);

// Wordmark PNGs at 2x and 4x
for (const scale of [2, 4]) {
  await sharp(Buffer.from(wordmark('#14213D')), { density: 72 * scale }).png().toFile(join(pub, `brand/kriosityops-logo@${scale}x.png`));
}

// favicon.ico with 16, 32 and 48 px PNG images inside
const sizes = [16, 32, 48];
const imgs = await Promise.all(sizes.map((s) => sharp(Buffer.from(mark), { density: 1200 }).resize(s, s).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const e = 6 + i * 16;
  header.writeUInt8(s, e);
  header.writeUInt8(s, e + 1);
  header.writeUInt8(0, e + 2);
  header.writeUInt8(0, e + 3);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(imgs[i].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += imgs[i].length;
});
writeFileSync(join(pub, 'favicon.ico'), Buffer.concat([header, ...imgs]));

writeFileSync(
  join(pub, 'site.webmanifest'),
  JSON.stringify(
    {
      name: 'KriosityOps',
      short_name: 'KriosityOps',
      description: 'One board for every app you run.',
      start_url: '/app',
      scope: '/',
      display: 'standalone',
      background_color: '#F3F5F8',
      theme_color: '#14213D',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    null,
    2,
  ) + '\n',
);
console.log('icons written');
