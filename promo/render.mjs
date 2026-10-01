// Renders the Maps 64 promo set into promo/output/ from ad.html (the game's own map, sprite, font and synth).
//   npm run render            everything
//   npm run render -- gif     only names containing "gif" (or any other filter word)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import gifsicle from 'gifsicle';

const HERE = import.meta.dirname, ROOT = path.resolve(HERE, '..'), OUT = path.join(HERE, 'output');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const filter = process.argv[2] || '';
const GIF_LIMIT = 150 * 1024;  // Google Ads limit for uploaded image ads

const JOBS = [
  // Instagram / Facebook
  {name: 'meta/maps64-reel-1080x1920.mp4', w: 1080, h: 1920, kind: 'video'},
  {name: 'meta/maps64-feed-1080x1350.mp4', w: 1080, h: 1350, kind: 'video'},
  {name: 'meta/maps64-feed-1080x1080.mp4', w: 1080, h: 1080, kind: 'video'},
  {name: 'meta/maps64-reel-1080x1920.png', w: 1080, h: 1920, kind: 'png', t: 7.5},
  {name: 'meta/maps64-feed-1080x1350.png', w: 1080, h: 1350, kind: 'png', t: 7.5},
  {name: 'meta/maps64-feed-1080x1080.png', w: 1080, h: 1080, kind: 'png', t: 7.5},
  // Google Ads: video (YouTube / Demand Gen)
  {name: 'google/video/maps64-youtube-1920x1080.mp4', w: 1920, h: 1080, kind: 'video'},
  {name: 'google/video/maps64-youtube-1920x1080-thumbnail.png', w: 1920, h: 1080, kind: 'png', t: 7.5},
  // Google Ads: animated banners (uploaded image ads)
  ...[[300,250],[336,280],[300,600],[160,600],[728,90],[970,250],[320,50],[320,100]].map(([w, h]) => ({name: `google/banners/maps64-${w}x${h}.gif`, w, h, kind: 'gif'})),
  // Google Ads: responsive display ads (Google asks for images without text, plus logos)
  {name: 'google/responsive/maps64-landscape-1200x628.png', w: 1200, h: 628, kind: 'clean', t: 3.4},
  {name: 'google/responsive/maps64-square-1200x1200.png', w: 1200, h: 1200, kind: 'clean', t: 3.4},
  {name: 'google/responsive/maps64-portrait-960x1200.png', w: 960, h: 1200, kind: 'clean', t: 3.4},
  {name: 'google/responsive/maps64-logo-1200x1200.png', w: 1200, h: 1200, kind: 'logo'},
  {name: 'google/responsive/maps64-logo-1200x300.png', w: 1200, h: 300, kind: 'logo'},
].filter(j => j.name.includes(filter));

// a tiny static server for the repo, so ad.html can load the game's files
const TYPES = {'.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.woff2':'font/woff2', '.png':'image/png'};
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ res.writeHead(404); return res.end(); }
  res.writeHead(200, {'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream'}); fs.createReadStream(f).pipe(res);
}).listen(0);
await once(server, 'listening');

const browser = await puppeteer.launch({executablePath: CHROME, headless: true, pipe: true, timeout: 90000, args: ['--disable-gpu']});
const page = await browser.newPage();
page.on('pageerror', e => console.error('page error:', e.message));
await page.goto(`http://localhost:${server.address().port}/promo/ad.html`);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'maps64-promo-'));
const b64 = url => Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
const run = (cmd, args, input) => new Promise((ok, fail) => {
  const p = spawn(cmd, args, {stdio: [input ? 'pipe' : 'ignore', 'ignore', 'pipe']}); let err = '';
  p.stderr.on('data', d => err += d); p.on('close', c => c ? fail(new Error(`${path.basename(cmd)} failed: ${err.slice(-600)}`)) : ok());
  if (input) input(p.stdin);
});
const kb = f => (fs.statSync(f).size / 1024).toFixed(0) + ' KB';

async function video(file, {w, h}){
  const dur = 10, fps = 30;
  await page.evaluate(o => setup(o), {w, h, mode: 'video'});
  const wav = path.join(tmp, 'audio.wav');
  fs.writeFileSync(wav, b64(',' + await page.evaluate(d => renderAudio(d), dur)));
  await run(ffmpeg, ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-', '-i', wav,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-tune', 'animation',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', file], async stdin => {
    for (let i = 0; i < dur * fps; i++){
      if (!stdin.write(b64(await page.evaluate(t => frame(t), i / fps)))) await once(stdin, 'drain');
    }
    stdin.end();
  });
}

async function gif(file, {w, h}){
  const dur = 7;  // played 3 times at most (loop count 2): ≤ 28 s, inside Google's 30 s limit
  await page.evaluate(o => setup(o), {w, h, mode: 'banner'});
  for (const [fps, colors, lossy] of [[10, 48, 0], [10, 40, 30], [8, 32, 60], [6, 32, 80]]){
    const dir = fs.mkdtempSync(path.join(tmp, 'gif-'));
    for (let i = 0; i < dur * fps; i++) fs.writeFileSync(path.join(dir, `f${String(i).padStart(4, '0')}.png`), b64(await page.evaluate(t => frame(t), i / fps)));
    const raw = path.join(dir, 'raw.gif');
    await run(ffmpeg, ['-y', '-framerate', String(fps), '-i', path.join(dir, 'f%04d.png'),
      '-vf', `split[a][b];[a]palettegen=max_colors=${colors}:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle`, raw]);
    await run(gifsicle, ['-O3', '--loopcount=2', ...(lossy ? [`--lossy=${lossy}`] : []), raw, '-o', file]);
    if (fs.statSync(file).size <= GIF_LIMIT) return `${fps} fps, ${colors} colours${lossy ? ', lossy ' + lossy : ''}`;
  }
  return 'OVER 150 KB';
}

for (const j of JOBS){
  const file = path.join(OUT, j.name); fs.mkdirSync(path.dirname(file), {recursive: true});
  const t0 = Date.now(); let note = '';
  if (j.kind === 'video') await video(file, j);
  else if (j.kind === 'gif') note = await gif(file, j);
  else if (j.kind === 'logo') fs.writeFileSync(file, b64(await page.evaluate(([w, h]) => logoImage(w, h), [j.w, j.h])));
  else {
    await page.evaluate(o => setup(o), {w: j.w, h: j.h, mode: j.kind === 'clean' ? 'still' : 'video'});
    fs.writeFileSync(file, b64(await page.evaluate(([t, hud]) => frame(t, {hud}), [j.t, j.kind !== 'clean'])));
  }
  console.log(`${j.name.padEnd(56)} ${kb(file).padStart(8)}  ${((Date.now() - t0) / 1000).toFixed(1)}s ${note}`);
}
await browser.close(); server.close(); fs.rmSync(tmp, {recursive: true, force: true});
