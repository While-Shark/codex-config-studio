import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const iconDir = join(process.cwd(), 'src-tauri', 'icons');
const pngs = [
  ['32x32.png', 32, 32],
  ['128x128.png', 128, 128],
  ['128x128@2x.png', 256, 256],
];

function readPngSize(file) {
  const data = readFileSync(file);
  if (data.length < 24 || data[0] !== 0x89 || data.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error(`${file} is not a valid PNG header`);
  }
  return [data.readUInt32BE(16), data.readUInt32BE(20)];
}

for (const [name, expectedWidth, expectedHeight] of pngs) {
  const file = join(iconDir, name);
  if (!existsSync(file)) throw new Error(`Missing generated icon: ${file}`);
  const [width, height] = readPngSize(file);
  if (width !== expectedWidth || height !== expectedHeight) {
    throw new Error(`${name} must be ${expectedWidth}x${expectedHeight}, got ${width}x${height}`);
  }
  if (width !== height) throw new Error(`${name} must be square`);
}

for (const name of ['icon.ico', 'icon.icns']) {
  const file = join(iconDir, name);
  if (!existsSync(file)) throw new Error(`Missing generated icon: ${file}`);
}

console.log('Generated desktop icons verified.');
