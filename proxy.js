/**
 * Metro proxy — rewrites bundle/asset URLs in the manifest so that
 * Expo Go uses the Cloudflare tunnel (HTTPS, no explicit port) instead
 * of the raw Metro address (HTTP :8081).
 *
 * Usage:
 *   CF_HOST=your-subdomain.trycloudflare.com node proxy.js
 */
const http = require('http');

const METRO_PORT = 8081;
const PROXY_PORT = 8082;
const CF_HOST = process.env.CF_HOST || '';

if (!CF_HOST) {
  console.error('ERROR: set CF_HOST env var to your trycloudflare.com subdomain');
  process.exit(1);
}

http.createServer((clientReq, clientRes) => {
  const opts = {
    hostname: '127.0.0.1',
    port: METRO_PORT,
    path: clientReq.url,
    method: clientReq.method,
    headers: { ...clientReq.headers, host: `localhost:${METRO_PORT}` },
  };

  const proxyReq = http.request(opts, (proxyRes) => {
    const ct = proxyRes.headers['content-type'] || '';
    const isText = ct.includes('application/json') || ct.includes('text/plain') || ct.includes('text/javascript');

    if (isText) {
      let raw = '';
      proxyRes.setEncoding('utf8');
      proxyRes.on('data', (c) => { raw += c; });
      proxyRes.on('end', () => {
        // Replace every occurrence of the local Metro origin with the tunnel URL
        const fixed = raw
          .replace(/http:\/\/[^"'\s]+:8081\//g, `https://${CF_HOST}/`)
          .replace(/192\.0\.0\.2:8081/g, CF_HOST);
        const buf = Buffer.from(fixed, 'utf8');
        clientRes.writeHead(proxyRes.statusCode, {
          ...proxyRes.headers,
          'content-length': buf.length,
        });
        clientRes.end(buf);
      });
    } else {
      clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(clientRes);
    }
  });

  proxyReq.on('error', (e) => {
    clientRes.writeHead(502);
    clientRes.end(`Proxy error: ${e.message}`);
  });

  clientReq.pipe(proxyReq);

}).listen(PROXY_PORT, '127.0.0.1', () => {
  console.log(`Proxy :${PROXY_PORT} → Metro :${METRO_PORT}`);
  console.log(`Rewriting bundle URLs → https://${CF_HOST}/`);
});
