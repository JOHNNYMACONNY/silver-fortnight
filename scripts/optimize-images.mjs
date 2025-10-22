// This script uses the 'imagemin' and 'imagemin-mozjpeg'/'imagemin-pngquant' plugins to optimize all PNG and JPEG images in the project.
// Usage: Run `node scripts/optimize-images.mjs` to optimize images in-place or to an 'optimized' directory.

import imagemin from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import path from 'path';
import fs from 'fs';

const INPUT_DIRS = [
  'src/stories/assets',
  'public/images',
  'public/icons',
];
const OUTPUT_DIR = 'public/optimized';

async function optimizeImages() {
  for (const dir of INPUT_DIRS) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => /\.(png|jpg|jpeg)$/i.test(f));
    if (!files.length) continue;
    const outDir = path.join(OUTPUT_DIR, path.relative('public', dir));
    fs.mkdirSync(outDir, { recursive: true });
    await imagemin(files.map(f => path.join(dir, f)), {
      destination: outDir,
      plugins: [
        imageminMozjpeg({ quality: 75 }),
        imageminPngquant({ quality: [0.6, 0.8] })
      ]
    });
    console.log(`Optimized images from ${dir} to ${outDir}`);
  }
}

optimizeImages().catch(console.error);
