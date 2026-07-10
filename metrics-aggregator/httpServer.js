import http from 'http';
import { argv } from 'process';
import metricsStore from './metricsStore.js';

export const httpServer = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/memory')
    res.writeHead(200, { 'Content-Type': 'application/json' });
  console.log('http server received GET /memory request');
  const containerMemoryUsages = metricsStore.getContainerMemoryUsages()
  console.log('Response data:', containerMemoryUsages)
  res.end(
    JSON.stringify({
      data: containerMemoryUsages,
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
