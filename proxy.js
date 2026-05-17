/**
 * Metro proxy — rewrites manifest bundle URLs so Expo Go uses the
 * Cloudflare tunnel (HTTPS, no port) instead of http://host:8081.
 * Passes JS bundles / Hermes bytecode / assets straight through.
 * Proxies WebSocket upgrades so the Expo runtime can fully initialise.
 *
 * Usage:
 *   CF_HOST=your-subdomain.trycloudflare.com node proxy.js
 */
const http = require('http');
const net  = require('net');

const METRO_PORT = 8081;
const PROXY_PORT = 8082;
const CF_HOST    = process.env.CF_HOST || '';

if (!CF_HOST) {
  console.error('ERROR: set CF_HOST env var to your trycloudflare.com subdomain');
  process.exit(1);
}

function rewrite(text) {
  return text.replace(/http:\/\/[^"'\s,\\]+:8081\//g, `https://${CF_HOST}/`);
}

function isManifest(contentType) {
  return /multipart\/mixed|application\/json|text\/plain/.test(contentType);
}

const server = http.createServer((clientReq, clientRes) => {
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
      const chunks = [];
      proxyRes.on('data', (c) => chunks.push(c));
      proxyRes.on('end', () => {
        const raw   = Buffer.concat(chunks).toString('utf8');
        const fixed = rewrite(raw);
        const buf   = Buffer.from(fixed, 'utf8');
        clientRes.writeHead(proxyRes.statusCode, {
          ...proxyRes.headers,
          'content-length': buf.length,
        });
        clientRes.end(buf);
      });
    } else {
      // Bundles, bytecode, assets — pipe without touching
      clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(clientRes);
    }
  });

  proxyReq.on('error', (e) => {
    clientRes.writeHead(502);
    clientRes.end(`Proxy error: ${e.message}`);
  });

  clientReq.pipe(proxyReq);
});

// WebSocket proxy — required for Expo runtime initialisation
server.on('upgrade', (req, socket, head) => {
  console.log(`WS upgrade: ${req.url}`);
  const target = net.connect(METRO_PORT, '127.0.0.1', () => {
    let headers = `${req.method} ${req.url} HTTP/1.1\r\n`;
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      headers += `${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}\r\n`;
    }
    headers += '\r\n';
    target.write(headers);
    if (head && head.length) target.write(head);
    socket.pipe(target);
    target.pipe(socket);
    socket.on('error', () => target.destroy());
    target.on('error', () => socket.destroy());
  });
  target.on('error', () => {
    socket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
    socket.destroy();
  });
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`Proxy :${PROXY_PORT} → Metro :${METRO_PORT}`);
  console.log(`Rewriting manifest URLs → https://${CF_HOST}/`);
});
