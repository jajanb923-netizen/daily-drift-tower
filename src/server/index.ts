import type { ServerResponse } from 'node:http';
import { createServer, reddit } from '@devvit/web/server';
import { dailyConfig, todayKey } from '../shared/seed.js';

function writeJson(res: ServerResponse, status: number, value: unknown): void {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname === '/api/daily') {
    const date = url.searchParams.get('date') ?? todayKey();
    writeJson(res, 200, dailyConfig(date));
    return;
  }
  if (url.pathname === '/api/health') {
    writeJson(res, 200, { ok: true });
    return;
  }
  if (url.pathname === '/internal/on/menu/new-post') {
    const post = await reddit.submitCustomPost({
      title: 'Daily Drift — Tower of the Day',
    });
    writeJson(res, 200, {
      showToast: { text: `Post ${post.id} created.`, appearance: 'success' },
      navigateTo: post.url,
    });
    return;
  }
  if (url.pathname === '/internal/on/app/install') {
    await reddit.submitCustomPost({
      title: 'Daily Drift — Tower of the Day',
    });
    writeJson(res, 200, {});
    return;
  }
  writeJson(res, 404, { error: 'not found' });
});

server.listen(3000, () => {
  // Devvit hosts this server; the port is only used for local runs.
  // eslint-disable-next-line no-console
  console.log('daily-drift-tower server listening');
});
