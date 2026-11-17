// Headless play-test + demo-video capture for Daily Drift.
// Serves dist/client, stubs /api/daily with the real seed config,
// plays the game, asserts HUD/timer/end screen, saves screenshots
// and a Playwright screen recording for the <1 min demo video.
const { chromium } = require('playwright-core');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = '/home/hatch/workspace/reddit-daily-game';
const OUT = '/home/hatch/workspace/reddit-daily-game/demo';
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  const file = path.join(ROOT, 'dist/client', url === '/' ? 'index.html' : url);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;

  // Real daily config, computed with the project's own seed logic.
  const seed = require('/tmp/drift-seed.cjs');
  const dateKey = new Date().toISOString().slice(0, 10);
  const cfg = seed.dailyConfig(dateKey);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 420, height: 900 },
    recordVideo: { dir: OUT, size: { width: 420, height: 900 } },
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => errors.push('reqfail: ' + r.url()));

  await page.route('**/api/daily*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cfg) }));

  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, '01-menu.png') });
  const menuVisible = await page.locator('#startBtn').isVisible();
  console.log('menu start button visible:', menuVisible);

  await page.click('#startBtn');
  await page.waitForTimeout(500);

  // Play: drop when the moving block is near the tower centre.
  // Simple robust approach: drop every ~650ms; wind may cause misses,
  // but height should still climb. Do 10 drops.
  let drops = 0;
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Space');
    drops++;
    await page.waitForTimeout(650);
    if (i === 4) await page.screenshot({ path: path.join(OUT, '02-playing.png') });
  }
  const heightMid = await page.locator('#height').innerText();
  const timerMid = await page.locator('#timer').innerText();
  console.log(`after ${drops} drops: height=${heightMid} timer=${timerMid}`);
  await page.screenshot({ path: path.join(OUT, '03-mid.png') });

  // Wait for the 60s timer to run out (we are ~7s in).
  await page.waitForSelector('#againBtn', { timeout: 60000 });
  const endText = await page.locator('.panel').innerText();
  console.log('end screen text:\n' + endText);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, '04-end.png') });

  // Play-again works?
  await page.click('#againBtn');
  await page.waitForTimeout(500);
  const timerAfter = await page.locator('#timer').innerText();
  const heightAfter = await page.locator('#height').innerText();
  console.log(`after Play again: timer=${timerAfter} height=${heightAfter}`);

  const heightFinal = parseInt(heightMid, 10);
  const verdict = {
    menuVisible,
    heightAfterDrops: heightFinal,
    timerCountingDown: parseInt(timerMid, 10) < 60,
    endScreenAppeared: endText.includes("Time's up!"),
    playAgainWorks: timerAfter === '60' && heightAfter === '0',
    consoleErrors: errors,
  };
  console.log('VERDICT:', JSON.stringify(verdict, null, 2));
  fs.writeFileSync(path.join(OUT, 'playtest-result.json'), JSON.stringify({ date: dateKey, cfg, verdict }, null, 2));

  await ctx.close();
  await browser.close();
  server.close();
  const pass = verdict.menuVisible && verdict.heightAfterDrops >= 3 && verdict.timerCountingDown
    && verdict.endScreenAppeared && verdict.playAgainWorks && errors.length === 0;
  console.log(pass ? 'PLAY-TEST: PASS' : 'PLAY-TEST: FAIL');
  process.exit(pass ? 0 : 1);
})().catch((e) => { console.error(e); server.close(); process.exit(2); });
