import http from 'http';
import { argv } from 'process';
import metricsStore from './metricsStore.js';
import EventEmitter from 'events';

const metricsEventEmitter = new EventEmitter();
const UPDATE_EVENT = 'metrics.update';

export const httpServer = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/api/metrics') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    console.log('http server received GET /metrics request');
    const containerMetrics = metricsStore.getAllContainerMetrics();
    console.log('Response data:', containerMetrics);
    res.end(
      JSON.stringify({
        data: containerMetrics,
      }),
    );
  }

  if (req.method === 'GET' && req.url === '/api/metrics/stream') {
    // Set headers to keep the connection alive and tell the client we're sending event-stream data
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendMetrics = () => {
      const containerMetricsString = JSON.stringify(
        metricsStore.getAllContainerMetrics(),
      );
      const data = `data: ${containerMetricsString}\n\n`
      res.write(data);
    };
    sendMetrics();
    metricsEventEmitter.addListener(UPDATE_EVENT, sendMetrics);

    // When client closes connection, stop sending events
    req.on('close', () => {
      res.end();
      metricsEventEmitter.removeListener(UPDATE_EVENT, sendMetrics);
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/webhooks/metrics') {
    // emit an event on the metricsEventEmitter
    metricsEventEmitter.emit(UPDATE_EVENT);
    // respond to the gRPC server 200
    res.writeHead(200);
    res.end();
    return;
  }
});

export function startHttpServer() {
  httpServer.listen(3000, () =>
    console.log('http server running on port 3000'),
  );
}

if (import.meta.filename === argv[1]) {
  startHttpServer();
}
