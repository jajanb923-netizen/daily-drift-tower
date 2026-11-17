import { createServer } from '@devvit/web/server';
import { dailyConfig, todayKey } from '../shared/seed.js';

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname === '/api/daily') {
    const date = url.searchParams.get('date') ?? todayKey();
    const cfg = dailyConfig(date);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(cfg));
    return;
  }
  if (url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(3000, () => {
  // Devvit hosts this server; the port is only used for local runs.
  // eslint-disable-next-line no-console
  console.log('daily-drift-tower server listening');
});
