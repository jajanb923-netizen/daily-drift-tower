# Daily Drift — Tower of the Day

A daily stacking game for **Reddit's Game of the Day Hackathon** ($35,000;
deadline **Tue 8 Dec 2026, 6:00 PM PT = Wed 9 Dec 09:00 WIB**).

## The game

- **60 seconds, one tower a day.** Tap / click / Space to drop each block.
  Land it square for a perfect bonus; miss and the block is gone.
- **Same day, same wind.** The wind strength, gusts, palette and block speed
  are seeded by the UTC date (`src/shared/seed.ts`) — every player in the
  world gets the same tower on the same day. The server (`/api/daily`) and
  the client compute the identical config, so the game also works offline.
- **Daily loop:** streak counter (consecutive days), best score, and a
  shareable emoji tower on the end card. New wind every day.
- **Tech:** Devvit Web (`@devvit/web` 0.15.0), vanilla TypeScript + Canvas,
  Vite build, no external assets, WebAudio blips, localStorage persistence.

## Why this game

- Daily games the judges cite (r/hotandcold, r/colorpuzzlegame, r/syllo)
  are bite-sized puzzles with a daily seed — this is that, with an arcade
  twist (wind + 60-second timer) instead of another word/number clone.
- Not a space shooter, trivia app, platformer or clone (explicitly
  low-scoring per the hackathon page). No Reddit/Snoo theming — the game
  has its own identity.

## Repo layout

```
devvit.json            # validated against Devvit config-file.v1 schema
src/client/            # index.html, main.ts, style.css (Vite -> dist/client)
src/server/index.ts    # /api/daily + /api/health via @devvit/web/server
src/shared/seed.ts     # daily seed, wind, palettes (client + server)
```

## Build & test (verified 2026-11-17)

```
npm install
npm run build        # vite client -> dist/client, esbuild server -> dist/server/index.cjs
npm run type-check   # tsc, clean
```

Headless play-test (Playwright, local preview server + stub `/api/daily`):
**PASS** — title loads, 6 drops → height 6, timer 60 → 55, end screen
"Time's up!" appears at 0, zero console errors. Re-verified 2026-11-17
~21:05 WIB with `scripts/playtest-headless.cjs`: menu OK, 10 drops →
height 6, timer counts down, end screen shows score 10 / best combo ×4 /
1-day streak + emoji share card, Play again resets to 60s/0, 0 console
errors. Screenshots + demo video in `demo/`.

## Deploy (needs a browser + Reddit account — NOT done yet)

1. Reddit account (create at reddit.com if none exists) → sign up at
   developers.reddit.com → `npx devvit login`
2. `npx devvit init` — or copy this folder — app name `daily-drift-tower`
   (17 chars, valid; change it if the name is taken)
3. `npm run dev` → playtest post on a test subreddit; `npm run deploy`
   (`devvit upload`) for a private build — **do NOT publish** (the
   hackathon prefers unpublished apps).
4. Make a demo post in a **public subreddit with < 200 members** running
   the game; keep it available for judging until 16 Dec.
5. Devpost: register + submit at https://redditgameofday2026.devpost.com/
   with the app listing link (`developers.reddit.com/apps/daily-drift-tower`),
   the demo post link, a description, and an optional < 1-minute demo video
   (YouTube). Optional: public GitHub repo link.

## Prizes

Best Daily Game $15,000 · Best Ported Daily Game $6,000 · 10× Honorable
Mention $1,000 · 6× Devvit Helper $500 · 5× Feedback $200.
Judging 9–16 Dec, winners ~17 Dec 2026.
