import http from 'http';
import https from 'https';

const PROXY_PORT = 8080;
// Backend thường chạy HTTPS (https://localhost:7237) — proxy phải gọi HTTPS, nếu không server đóng → socket hang up
const BACKEND = 'https://127.0.0.1:7237';
const FRONTEND = 'http://127.0.0.1:5173';

const server = http.createServer((clientReq, clientRes) => {
  const path = clientReq.url || '/';
  const isApi = path.startsWith('/api') || path.startsWith('/Api');
  const target = isApi ? BACKEND : FRONTEND;
  const u = new URL(path, target + '/');

  const opts = {
    hostname: u.hostname,
    port: u.port || (u.protocol === 'https:' ? 443 : 80),
    path: u.pathname + u.search,
    method: clientReq.method,
    headers: { ...clientReq.headers, host: u.host },
    ...(u.protocol === 'https:' && { rejectUnauthorized: false }), // chấp nhận cert self-signed (localhost)
  };

  const requestModule = u.protocol === 'https:' ? https : http;
  const proxyReq = requestModule.request(opts, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes);
  });
  proxyReq.on('error', (err) => {
    console.error('[proxy error]', err.message);
    clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
    clientRes.end('Bad Gateway: ' + err.message);
  });

  clientReq.pipe(proxyReq);
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`Tunnel proxy: http://localhost:${PROXY_PORT}`);
  console.log(`  /api/*  -> ${BACKEND}`);
  console.log(`  /*      -> ${FRONTEND}`);
  console.log(`\nChạy: ngrok http ${PROXY_PORT}`);
  console.log(`Frontend cần: VITE_API_URL=/api npm run dev`);
});
