import { chromium } from 'playwright';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readdirSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const execFileP = promisify(execFile);

const URL = 'https://iss-live-tracker-xi.vercel.app/';
const VIDEO_DIR = resolve('./.recording');
const FINAL_MP4 = resolve('./iss-tracker-demo.mp4');

if (existsSync(VIDEO_DIR)) rmSync(VIDEO_DIR, { recursive: true, force: true });
mkdirSync(VIDEO_DIR, { recursive: true });

console.log('launching chromium…');
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 800 } },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

console.log(`loading ${URL}`);
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

// give live data + map tiles time to populate
await page.waitForTimeout(5000);

// hold ~3s on the loaded hero/map
await page.waitForTimeout(3000);

// smooth scroll using in-page JS — finds the actual scrollable container
// (page or a child with overflow:auto) so it works even if the sidebar
// is its own scroll region.
await page.evaluate(async ({ totalScroll, stepPx, stepDelay }) => {
  const findScrollable = () => {
    if (document.documentElement.scrollHeight > window.innerHeight + 10) return null;
    let best = null, bestHeight = 0;
    for (const el of document.querySelectorAll('*')) {
      const s = getComputedStyle(el);
      if ((s.overflowY === 'auto' || s.overflowY === 'scroll')
          && el.scrollHeight > el.clientHeight + 10
          && el.clientHeight > 200
          && el.scrollHeight > bestHeight) {
        best = el; bestHeight = el.scrollHeight;
      }
    }
    return best;
  };
  const target = findScrollable();
  const scrollBy = (d) => target ? (target.scrollTop += d) : window.scrollBy(0, d);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const steps = Math.ceil(totalScroll / stepPx);
  for (let i = 0; i < steps; i++) { scrollBy(stepPx); await sleep(stepDelay); }
  for (let i = 0; i < steps; i++) { scrollBy(-stepPx); await sleep(stepDelay); }
}, { totalScroll: 2200, stepPx: 8, stepDelay: 20 });

// settle on map for the closing beat
await page.waitForTimeout(1200);

console.log('closing context to flush video…');
await context.close();
await browser.close();

const webms = readdirSync(VIDEO_DIR).filter(f => f.endsWith('.webm'));
if (!webms.length) throw new Error('no .webm produced');
const webm = join(VIDEO_DIR, webms[0]);

console.log(`transcoding ${webm} → ${FINAL_MP4}`);
await execFileP(ffmpegPath.path, [
  '-y',
  '-i', webm,
  '-c:v', 'libx264',
  '-preset', 'medium',
  '-crf', '22',
  '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart',
  '-r', '30',
  FINAL_MP4,
]);

rmSync(VIDEO_DIR, { recursive: true, force: true });
console.log('done:', FINAL_MP4);
