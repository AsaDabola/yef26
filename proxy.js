/**
 * Metro proxy — rewrites bundle/asset URLs in ALL responses so that
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

// Rewrite any http://anything:8081/ or http://anything:8081 to the tunnel HTTPS URL
function rewrite(text) {
  return text
    .replace(/http:\/\/[^"'\s,]+:8081(\/)/g, `https://${CF_HOST}$1`)
    .replace(/http:\/\/[^"'\s,]+:8081([^/])/g, `https://${CF_HOST}$1`)
    .replace(/http:\/\/[^"'\s,]+:8081$/gm, `https://${CF_HOST}`);
}

function isBinary(contentType) {
  return /image\/|audio\/|video\/|font\/|application\/octet/.test(contentType);
}

http.createServer((clientReq, clientRes) => {
  // Pass the original Host header through so Metro uses the tunnel hostname
  // in its generated bundle URLs, making them easier to rewrite.
  const opts = {
    hostname: '127.0.0.1',
    port: METRO_PORT,
    path: clientReq.url,
    method: clientReq.method,
    headers: clientReq.headers,
  };

  const proxyReq = http.request(opts, (proxyRes) => {
    const ct = proxyRes.headers['content-type'] || '';

    if (isBinary(ct)) {
      clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(clientRes);
      return;
    }

    // Buffer and rewrite text/json/multipart responses
    const chunks = [];
    proxyRes.on('data', (c) => chunks.push(c));
    proxyRes.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      const fixed = rewrite(raw);
      const buf = Buffer.from(fixed, 'utf8');
      const headers = { ...proxyRes.headers, 'content-length': buf.length };
      clientRes.writeHead(proxyRes.statusCode, headers);
      clientRes.end(buf);
    });
  });

  proxyReq.on('error', (e) => {
    clientRes.writeHead(502);
    clientRes.end(`Proxy error: ${e.message}`);
  });

  clientReq.pipe(proxyReq);

}).listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`Proxy :${PROXY_PORT} → Metro :${METRO_PORT}`);
  console.log(`Rewriting bundle URLs → https://${CF_HOST}/`);
});
