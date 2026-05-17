/**
 * Metro proxy — rewrites bundle URLs ONLY in manifest JSON responses so
 * Expo Go uses the Cloudflare tunnel (HTTPS, no port) instead of the raw
 * Metro address (HTTP :8081).  All other responses (JS bundles, assets,
 * Hermes bytecode) are piped through untouched.
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

function rewrite(text) {
  // Replace http://anything:8081/ → https://CF_HOST/
  return text.replace(/http:\/\/[^"'\s,\\]+:8081\//g, `https://${CF_HOST}/`);
}

function isManifest(contentType) {
  // Only rewrite Expo manifest responses — multipart or JSON, never JS/bytecode
  return /multipart\/mixed|application\/json|text\/plain/.test(contentType);
}

http.createServer((clientReq, clientRes) => {
  const opts = {
    hostname: '127.0.0.1',
    port: METRO_PORT,
    path: clientReq.url,
    method: clientReq.method,
    headers: clientReq.headers,
  };

  const proxyReq = http.request(opts, (proxyRes) => {
    const ct = proxyRes.headers['content-type'] || '';

    if (isManifest(ct)) {
      // Buffer manifest, rewrite URLs, forward
      const chunks = [];
      proxyRes.on('data', (c) => chunks.push(c));
      proxyRes.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        const fixed = rewrite(raw);
        const buf = Buffer.from(fixed, 'utf8');
        clientRes.writeHead(proxyRes.statusCode, {
          ...proxyRes.headers,
          'content-length': buf.length,
        });
        clientRes.end(buf);
      });
    } else {
      // Pass JS bundles, Hermes bytecode, assets straight through — do NOT touch
      clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(clientRes);
    }
  });

  proxyReq.on('error', (e) => {
    clientRes.writeHead(502);
    clientRes.end(`Proxy error: ${e.message}`);
  });

  clientReq.pipe(proxyReq);

}).listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`Proxy :${PROXY_PORT} → Metro :${METRO_PORT}`);
  console.log(`Rewriting manifest URLs → https://${CF_HOST}/`);
});
