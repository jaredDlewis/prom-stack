import http from 'http';
import { argv } from 'process';
import metricsStore from './metricsStore.js';

export const httpServer = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/metrics')
    res.writeHead(200, { 'Content-Type': 'application/json' });
  console.log('http server received GET /metrics request');
  const containerMetrics = metricsStore.getAllContainerMetrics();
  console.log('Response data:', containerMetrics);
  res.end(
    JSON.stringify({
      data: containerMetrics,
    }),
  );
});

export function startHttpServer() {
  httpServer.listen(3000, () =>
    console.log('http server running on port 3000'),
  );
}

if (import.meta.filename === argv[1]) {
  startHttpServer();
}
