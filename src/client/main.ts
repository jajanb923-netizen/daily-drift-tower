import { dailyConfig, todayKey, mulberry32, PALETTES, type DailyConfig } from '../shared/seed.js';

// ---------------------------------------------------------------------------
// Daily Drift — Tower of the Day
// A 60-second daily stacking game. Everyone plays the same wind, palette and
// block speed on the same day (seeded by the UTC date). No network needed
// after the first load: the /api/daily config is fetched when available and
// the client falls back to the identical local computation.
// ---------------------------------------------------------------------------

const W = 360;
const H = 480;
const GROUND_Y = 440;
const BLOCK_H = 24;
const GAME_SECONDS = 60;
const STORE_KEY = 'daily-drift-v1';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const timerEl = document.getElementById('timer')!;
const heightEl = document.getElementById('height')!;
const bestEl = document.getElementById('best')!;
const streakEl = document.getElementById('streak')!;
const dateLabelEl = document.getElementById('dateLabel')!;
const windArrowEl = document.getElementById('windArrow')!;
const windFillEl = document.getElementById('windFill')!;
const windLabelEl = document.getElementById('windLabel')!;
const overlayEl = document.getElementById('overlay')!;
const muteBtn = document.getElementById('muteBtn')!;

interface Block { x: number; w: number; y: number; color: string; }
interface Store { lastPlayed: string; streak: number; best: number; muted: boolean; }

let store: Store = { lastPlayed: '', streak: 0, best: 0, muted: false };
try {
  const raw = localStorage.getItem(STORE_KEY);
  if (raw) store = { ...store, ...JSON.parse(raw) };
} catch { /* storage unavailable (webview) — play without persistence */ }
function saveStore() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch { /* ignore */ }
}

// --- sound (tiny WebAudio blips, no assets) ---
let audio: AudioContext | null = null;
function tone(freq: number, dur = 0.08, type: OscillatorType = 'sine', vol = 0.08) {
  if (store.muted) return;
  try {
    audio ??= new AudioContext();
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
    o.connect(g).connect(audio.destination);
    o.start(); o.stop(audio.currentTime + dur);
  } catch { /* audio unavailable */ }
}

// --- game state ---
let cfg: DailyConfig = dailyConfig(todayKey());
let palette = PALETTES[cfg.palette];
let state: 'menu' | 'playing' | 'over' = 'menu';
let tower: Block[] = [];
let moving: { x: number; w: number; dir: number; speed: number } | null = null;
let falling: { x: number; w: number; y: number; vy: number; vx: number; color: string; dead: boolean } | null = null;
let timeLeft = GAME_SECONDS;
let score = 0;
let combo = 0;
let bestCombo = 0;
let elapsed = 0;
let camY = 0; // camera scroll offset (world -> screen)
let wind = 0;
let windPhase = 0;
let shake = 0;
let particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];
let lastTs = 0;

function blockColor(i: number): string {
  return palette.tower[i % palette.tower.length];
}

function resetGame() {
  tower = [{ x: 0, w: W, y: GROUND_Y, color: '#22303a' }]; // ground platform
  score = 0; combo = 0; bestCombo = 0; timeLeft = GAME_SECONDS; elapsed = 0;
  camY = 0; falling = null; particles = [];
  spawnMoving();
  state = 'playing';
  overlayEl.innerHTML = '';
  updateHud();
}

function spawnMoving() {
  const top = tower[tower.length - 1];
  const w = Math.max(48, top.w * 0.94);
  moving = { x: (W - w) / 2, w, dir: Math.random() > 0.5 ? 1 : -1, speed: (95 + tower.length * 4) * cfg.speed };
}

function windAt(t: number): number {
  // Gusts change every few seconds; deterministic per day.
  const rnd = mulberry32(cfg.seed + Math.floor(t / 3.5) * 7919);
  const gust = rnd() * 2 - 1;
  return cfg.windBase * gust * 130; // px/s of horizontal drift while falling
}

function drop() {
  if (state !== 'playing' || !moving || falling) return;
  const color = blockColor(tower.length);
  falling = { x: moving.x, w: moving.w, y: topY() - BLOCK_H, vy: 0, vx: wind, color, dead: false };
  moving = null;
  tone(220, 0.05, 'triangle', 0.05);
}

function topY(): number {
  return tower[tower.length - 1].y - BLOCK_H;
}

function landBlock() {
  if (!falling) return;
  const top = tower[tower.length - 1];
  const fx = falling.x;
  const fw = falling.w;
  const overlapX = Math.max(fx, top.x);
  const overlapW = Math.min(fx + fw, top.x + top.w) - overlapX;
  if (overlapW <= 2) {
    // Missed the tower entirely: block tumbles away.
    falling.dead = true;
    combo = 0;
    shake = 6;
    tone(110, 0.18, 'sawtooth', 0.06);
  } else {
    const perfect = overlapW >= fw * 0.92;
    const kept: Block = { x: overlapX, w: overlapW, y: top.y - BLOCK_H, color: falling.color };
    tower.push(kept);
    score += 1;
    if (perfect) {
      combo += 1;
      bestCombo = Math.max(bestCombo, combo);
      score += 1; // perfect bonus point
      burst(kept.x + kept.w / 2, kept.y, palette.accent);
      tone(660 + combo * 40, 0.1, 'sine', 0.09);
      tone(880 + combo * 40, 0.12, 'sine', 0.07);
    } else {
      combo = 0;
      tone(440, 0.06, 'sine', 0.06);
    }
    // Camera follows the tower up.
    const targetCam = Math.max(0, GROUND_Y - kept.y - 380);
    camY = targetCam;
  }
  falling = null;
  if (state === 'playing') spawnMoving();
  updateHud();
}

function burst(x: number, y: number, color: string) {
  for (let i = 0; i < 14; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 260,
      vy: -Math.random() * 220 - 40,
      life: 0.6, color,
    });
  }
}

function updateHud() {
  timerEl.textContent = String(Math.max(0, Math.ceil(timeLeft)));
  heightEl.textContent = String(Math.max(0, tower.length - 1));
  bestEl.textContent = String(Math.max(store.best, score));
  streakEl.textContent = String(store.streak);
}

function endGame() {
  state = 'over';
  const height = Math.max(0, tower.length - 1);
  const date = cfg.date;
  const playedToday = store.lastPlayed === date;
  if (!playedToday) {
    // Streak: consecutive calendar days.
    const yesterday = new Date(date + 'T12:00:00Z');
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yKey = yesterday.toISOString().slice(0, 10);
    store.streak = store.lastPlayed === yKey ? store.streak + 1 : 1;
    store.lastPlayed = date;
  }
  store.best = Math.max(store.best, score);
  saveStore();
  updateHud();
  const emojiRows = tower.slice(1).map((b) => '🟧'.repeat(Math.max(1, Math.round(b.w / 36)))).join('\n');
  const share = `🌬️ Daily Drift — ${date}\n${emojiRows || '⬜'}\n${height} blocks · ${score} pts · 🔥 ${store.streak}-day streak`;
  overlayEl.innerHTML = `
    <div class="panel">
      <h2>⏰ Time's up!</h2>
      <div class="big">${height} blocks</div>
      <p>Score ${score} · Best combo ×${bestCombo} · Best ${store.best}<br/>🔥 Streak: ${store.streak} day(s) — come back tomorrow for a new wind!</p>
      <pre class="share">${share.replace(/</g, '&lt;')}</pre>
      <button id="againBtn">Play again</button>
      <button id="copyBtn" class="secondary">Copy result</button>
    </div>`;
  document.getElementById('againBtn')?.addEventListener('click', resetGame);
  document.getElementById('copyBtn')?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(share); tone(880, 0.08); } catch { /* clipboard unavailable */ }
  });
  tone(330, 0.2, 'sine', 0.08);
  tone(220, 0.3, 'sine', 0.07);
}

function showMenu() {
  state = 'menu';
  overlayEl.innerHTML = `
    <div class="panel">
      <h2>🌬️ Tower of the Day</h2>
      <p>One tower, one wind, one minute — the same for everyone today.<br/>
      Tap, click or press <b>Space</b> to drop each block. Land it square for a perfect bonus. Miss and the block is gone.<br/>
      Wind today: <b>${Math.round(cfg.windBase * 100)}%</b> · Best: ${store.best} · Streak: ${store.streak} 🔥</p>
      <button id="startBtn">▶ Play today's tower</button>
    </div>`;
  document.getElementById('startBtn')?.addEventListener('click', () => { tone(520, 0.08); resetGame(); });
}

// --- render ---
function draw() {
  ctx.save();
  ctx.fillStyle = palette.sky;
  ctx.fillRect(0, 0, W, H);
  // subtle stars
  const rnd = mulberry32(cfg.seed);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 24; i++) {
    ctx.fillRect(rnd() * W, rnd() * H, 2, 2);
  }
  if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  ctx.translate(0, camY);
  // ground
  ctx.fillStyle = '#22303a';
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.fillStyle = palette.accent;
  ctx.fillRect(0, GROUND_Y, W, 4);
  // tower
  for (const b of tower.slice(1)) {
    ctx.fillStyle = b.color;
    roundRect(b.x + 1, b.y, b.w - 2, BLOCK_H, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(b.x + 3, b.y + 2, b.w - 6, 4);
  }
  // moving block
  if (moving) {
    ctx.fillStyle = blockColor(tower.length);
    ctx.globalAlpha = 0.92;
    roundRect(moving.x + 1, topY(), moving.w - 2, BLOCK_H, 4);
    ctx.globalAlpha = 1;
    // drop guide
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(moving.x + moving.w / 2, topY() + BLOCK_H);
    ctx.lineTo(moving.x + moving.w / 2, tower[tower.length - 1].y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // falling block
  if (falling) {
    ctx.fillStyle = falling.color;
    roundRect(falling.x + 1, falling.y, falling.w - 2, BLOCK_H, 4);
  }
  // particles
  for (const p of particles) {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.life / 0.6);
    ctx.fillRect(p.x, p.y, 4, 4);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  // timer ring (screen space)
  if (state === 'playing') {
    const frac = timeLeft / GAME_SECONDS;
    ctx.strokeStyle = frac < 0.25 ? '#ff6b6b' : palette.accent;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(W - 26, 26, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
    ctx.stroke();
  }
}

function roundRect(x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

// --- loop ---
function tick(ts: number) {
  const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0);
  lastTs = ts;
  if (state === 'playing') {
    elapsed += dt;
    timeLeft = Math.max(0, GAME_SECONDS - elapsed);
    windPhase += dt;
    wind = windAt(elapsed);
    windArrowEl.textContent = wind >= 0 ? '→' : '←';
    windArrowEl.style.transform = `scaleX(${wind >= 0 ? 1 : -1})`;
    windFillEl.style.width = `${Math.min(100, Math.abs(wind) / 130 * 100)}%`;
    windLabelEl.textContent = `Wind ${Math.round(Math.abs(wind) / 130 * 100)}`;
    if (moving) {
      moving.x += moving.dir * moving.speed * dt;
      if (moving.x <= 0) { moving.x = 0; moving.dir = 1; }
      if (moving.x + moving.w >= W) { moving.x = W - moving.w; moving.dir = -1; }
    }
    if (falling) {
      falling.vy += 2600 * dt;
      falling.vx = wind;
      falling.x += falling.vx * dt;
      falling.y += falling.vy * dt;
      const top = tower[tower.length - 1];
      if (falling.y >= top.y - BLOCK_H) {
        falling.y = top.y - BLOCK_H;
        landBlock();
      }
      if (falling && falling.dead) falling = null;
    }
    // dead (missed) blocks keep tumbling visually via particles only
    for (const p of particles) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.life -= dt;
    }
    particles = particles.filter((p) => p.life > 0);
    if (shake > 0) shake = Math.max(0, shake - dt * 30);
    updateHud();
    if (timeLeft <= 0) endGame();
  }
  draw();
  requestAnimationFrame(tick);
}

// --- input ---
canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); drop(); });
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); drop(); }
});
muteBtn.addEventListener('click', () => {
  store.muted = !store.muted;
  saveStore();
  muteBtn.textContent = store.muted ? '🔇' : '🔊';
});
muteBtn.textContent = store.muted ? '🔇' : '🔊';

// --- boot: fetch the server's daily config, fall back to local math ---
async function boot() {
  dateLabelEl.textContent = `Tower of the Day · ${cfg.date}`;
  try {
    const res = await fetch(`/api/daily?date=${cfg.date}`);
    if (res.ok) {
      const remote = (await res.json()) as DailyConfig;
      cfg = remote;
      palette = PALETTES[cfg.palette % PALETTES.length];
    }
  } catch { /* offline/dev preview: local config is identical */ }
  document.body.style.background = palette.sky;
  canvas.style.background = palette.sky;
  dateLabelEl.textContent = `Tower of the Day · ${cfg.date} · Wind ${Math.round(cfg.windBase * 100)}%`;
  updateHud();
  showMenu();
  requestAnimationFrame(tick);
}

void boot();
