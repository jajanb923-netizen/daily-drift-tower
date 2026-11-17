# SUBMIT CHECKLIST — Daily Drift (Reddit Game of the Day)

**Hackathon:** Reddit's Game of the Day, $35,000 — deadline **Tue 8 Dec 2026
6:00 PM PT = Wed 9 Dec 09:00 WIB**. Judging 9–16 Dec, winners ~17 Dec.
Official page: https://redditgameofday2026.devpost.com/

**Status 2026-11-17 ~21:10 WIB: READY TO SUBMIT — game verified, all
browser steps still open.** Nothing here needs money. Do NOT use X/Twitter.
Do NOT touch other running entries/crons.

## 0. What is already done (verified 2026-11-17 ~21:05 WIB)
- `npm run build` OK, `npm run type-check` clean.
- Headless play-test PASS (`scripts/playtest-headless.cjs`): menu OK,
  10 drops → height 6, timer counts down, end screen "Time's up!" with
  score/combo/streak + emoji share card, Play again resets, 0 console errors.
- Demo video ready: `demo/daily-drift-demo.mp4` — 48 s (< 1 min), 332 KB,
  MP4. Raw recording: `demo/*.webm` (72.8 s). Screenshots: `demo/01-menu.png`,
  `02-playing.png`, `03-mid.png`, `04-end.png`.
- GitHub repo name `jajanb923-netizen/daily-drift-tower` checked via GitHub
  API 2026-11-17 → **404 = available**.
- Known limitation: the built server (`dist/server/index.cjs`) cannot run
  standalone — `@devvit/web/server` requires Devvit request context
  (crashes with "subreddit is missing from Context" on plain curl). This
  is expected; the server runs inside Devvit's runtime. The client has an
  identical local fallback for `/api/daily`, so the game works even if the
  server call fails. Validate the server for real during `devvit playtest`
  (step 3).

## 1. GitHub repo (public) — via signed-in cloud browser
Per standing instruction: create the repo in the browser, do not ask the
user to do it on their phone.
1. Open https://github.com/new while signed in as `jajanb923-netizen`.
2. Repository name: `daily-drift-tower`. Description: `Daily Drift — Tower
   of the Day. A 60-second daily stacking game for Reddit's Game of the
   Day Hackathon (Devvit Web).` Public. Do NOT add README/LICENSE/.gitignore
   (they already exist in the folder).
3. Push the files below (text files via the `github push-files` tool;
   no binary files needed in the repo — the demo video goes to YouTube,
   not GitHub). Verify afterwards via GitHub API: README badges, About,
   LICENSE MIT, `.makefun` NOT needed here (this is not make.fun).

**Files to push (from `~/workspace/reddit-daily-game/`):**
```
.gitignore
LICENSE
README.md
STATUS.md
SUBMIT-CHECKLIST.md        (this file)
devvit.json
package.json
package-lock.json
tsconfig.json
tsconfig.server.json
vite.config.ts
src/client/index.html
src/client/main.ts
src/client/style.css
src/server/index.ts
src/shared/seed.ts
scripts/playtest-headless.cjs
demo/01-menu.png
demo/02-playing.png
demo/03-mid.png
demo/04-end.png
demo/playtest-result.json
```
Do NOT push: `node_modules/`, `dist/`, `demo/*.webm` (raw recording),
`demo/daily-drift-demo.mp4` (goes to YouTube), `demo/contact-sheet.png`.

## 2. Reddit account + Devvit login (browser)
1. Create a Reddit account at https://www.reddit.com/register with email
   `jajanb923@gmail.com`. Suggested username: **`daily-drift`** (fallback
   if taken: `dailydriftgame`, `toweroftheday`, `drift-tower`).
   Verify the email (Reddit sends a confirmation link).
2. Sign up at https://developers.reddit.com (same Reddit account) —
   accept the developer terms.
3. In the terminal (VM, project folder): `npx devvit login` — follow the
   browser OAuth flow. Confirm with `npx devvit whoami` if available.

## 3. Playtest + upload (terminal, after step 2)
```bash
cd ~/workspace/reddit-daily-game
npm install          # if needed
npm run build        # rebuild fresh dist/
npm run dev          # = devvit playtest — opens a playtest post on a test subreddit
```
- Play the game in the playtest post: menu → start → drop blocks → end
  screen. Confirm `/api/daily` returns the daily config (check the
  Network tab — this is the first real test of the server inside Devvit).
- Then: `npm run deploy` (= `devvit upload`) — creates a **private**
  build. **Do NOT publish the app** (the hackathon explicitly asks not to
  publish before judging).

## 4. Demo post (browser, after step 3)
1. Create or pick a **public subreddit with < 200 members** that you
   control (create one at https://www.reddit.com/subreddits/create if
   needed — e.g. `r/dailydrifttower`). It must be public.
2. Make a post in that subreddit running the game (use the uploaded app's
   "Create post" / playtest link from the Devvit developer portal).
3. Copy the post URL — it goes into the Devpost submission.
4. Keep the post + subreddit up until judging ends (16 Dec 2026).

## 5. Devpost submission (browser)
1. Register + open https://redditgameofday2026.devpost.com/ as the user
   (email `jajanb923@gmail.com`).
2. Submit with:
   - **App listing link:** `https://developers.reddit.com/apps/daily-drift-tower`
     (if the app name was taken at upload time, use the actual name and
     update `devvit.json`, `package.json`, and README to match).
   - **Demo post link:** the URL from step 4.
   - **Description:** use `README.md` (game concept, daily seed, 60 s,
     streak/share) + note the repo link
     `https://github.com/jajanb923-netizen/daily-drift-tower`.
   - **Demo video (optional, < 1 min):** upload `demo/daily-drift-demo.mp4`
     to the user's YouTube channel "Jajan Bae" (unlisted is fine) and paste
     the link. Video is 48 s — inside the limit.
   - Optional: public repo link (step 1), feedback survey (qualifies for
     the $200 Feedback prizes — fill it in if the form is offered).
3. Submit before **Wed 9 Dec 2026 09:00 WIB**. Confirm the submission
   shows as received on Devpost.

## 6. App-name fallbacks
`daily-drift-tower` may already be taken on Reddit (check at upload time).
If taken, use one of these (in order), and update `devvit.json` (`name`),
`package.json` (`name`), README title, and the Devpost app-listing link:
1. `daily-drift-game`
2. `tower-of-the-day`
3. `drift-tower-daily`
4. `windy-tower-daily`

## After submit
- Do NOT publish the app. Keep the demo post up until 16 Dec.
- Results ~17 Dec. If it wins, the prize is paid per Devpost rules
  (check payout details on the Devpost page at that time).
- Notify the user with: app listing link, demo post link, Devpost
  submission confirmation, video link.
