# STATUS — Reddit Game of the Day: Daily Drift

## What it is
- **Game:** "Daily Drift — Tower of the Day", a 60-second daily stacking
  game on Devvit Web. Same wind/palette/speed for everyone each day
  (seeded by UTC date). Streaks, best score, shareable emoji tower.
- **Hackathon:** Reddit's Game of the Day, $35,000. Deadline **Tue 8 Dec
  2026 6:00 PM PT (= Wed 9 Dec 09:00 WIB)**. Judging 9–16 Dec, winners
  ~17 Dec. Official page: https://redditgameofday2026.devpost.com/
- **Eligibility (verified on official rules page 2026-11-17):** Indonesia
  NOT in the excluded list (Brazil, Quebec, Russia, Crimea, Cuba, Iran,
  North Korea, Syria, OFAC). Age of majority. Free entry, no purchase.
- **Prizes:** Best Daily Game $15,000 · Best Ported $6,000 · 10× Honorable
  Mention $1,000 · 6× Devvit Helper $500 · 5× Feedback $200.

## Status 2026-11-17 ~21:10 WIB: READY TO SUBMIT (game verified, browser steps open)
- Local repo: `~/workspace/reddit-daily-game/` — devvit.json (VALIDATED
  against the Devvit config-file.v1 schema), src/client, src/server,
  src/shared/seed.ts, README, LICENSE (MIT), .gitignore.
- `npm run build` OK (vite client → dist/client, esbuild server →
  dist/server/index.cjs). `npm run type-check` clean. Re-verified
  2026-11-17 ~21:05 WIB.
- Headless play-test **PASS** (Playwright, `scripts/playtest-headless.cjs`,
  re-run 2026-11-17 ~21:05 WIB): menu OK, 10 drops → height 6, timer
  counts down, end screen "Time's up!" (score 10, best combo ×4, 1-day
  streak, emoji share card), Play again resets to 60s/0, **zero console
  errors**. Result: `demo/playtest-result.json`.
- Demo video READY: `demo/daily-drift-demo.mp4` — **48 s (< 1 min)**,
  332 KB MP4 (sped-up full run: menu → gameplay → end screen). Raw
  recording `demo/*.webm` (72.8 s). Screenshots `demo/01-menu.png`,
  `02-playing.png`, `03-mid.png`, `04-end.png`.
- GitHub repo name `jajanb923-netizen/daily-drift-tower` checked via
  GitHub API 2026-11-17 → **404 = available**.
- Full step-by-step browser instructions: `SUBMIT-CHECKLIST.md`
  (repo push file list, Reddit account, devvit login, playtest/upload,
  demo post, Devpost submit, name fallbacks).

## Known limitation (not a blocker)
- The built server (`dist/server/index.cjs`) cannot run standalone:
  `@devvit/web/server` requires Devvit request context (plain curl
  crashes with "subreddit is missing from Context"). Expected — the
  server only runs inside Devvit's runtime. The client has an identical
  local fallback for `/api/daily`, so the game works even if the server
  call fails. First real server test happens during `devvit playtest`.

## NOT done yet — needs the parent agent / browser
1. **GitHub repo** `jajanb923-netizen/daily-drift-tower` (public) — create
   via the signed-in cloud browser, push the files listed in
   `SUBMIT-CHECKLIST.md` §1 (text via github push-files; no binaries
   needed in the repo).
2. **Reddit account** — none exists yet for the user as far as we know.
   Create one (free, email jajanb923@gmail.com, suggested username
   `daily-drift`), sign up at developers.reddit.com, `npx devvit login`.
3. **Upload + playtest:** `npm run dev` (playtest), `npm run deploy`
   (`devvit upload`, private build — do NOT publish).
4. **Demo post** in a public subreddit with < 200 members, running the
   game; keep it up until judging ends 16 Dec.
5. **Devpost submit:** register + submit with app listing link
   (developers.reddit.com/apps/daily-drift-tower), demo post link,
   description, demo video (upload `demo/daily-drift-demo.mp4` to
   YouTube channel "Jajan Bae"). Optional: repo link, feedback survey
   (qualifies for the $200 Feedback prizes).
- **Risk:** app name `daily-drift-tower` may already be taken on Reddit —
  fallbacks in `SUBMIT-CHECKLIST.md` §6 (daily-drift-game,
  tower-of-the-day, drift-tower-daily, windy-tower-daily); change it at
  upload time and update devvit.json + package.json + README + Devpost link.
- **Note:** `developers.reddit.com` text-fetch is blocked by policy in
  this environment; the Devvit Web API used here was verified from the
  installed `@devvit/web@0.15.0` package (server `createServer`, config
  schema) instead of the docs site.
