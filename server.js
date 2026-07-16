const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const APP_SCRIPT_URL = process.env.ROADTRIP_API_URL || '  "https://script.google.com/macros/s/AKfycbwIYbLmdmhcIWZz344rvIJwm60a1i3FrN2ElT5kUGQISbFOLrIZQa72xNLhIyjFNE8F/exec";
';

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    default:
      return 'application/octet-stream';
  }
}

function readStaticFile(res, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentTypeFor(filePath) });
    res.end(content);
  });
}

function proxyRoadtrip(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  const targetUrl = new URL(APP_SCRIPT_URL);

  const proxyReq = https.get(targetUrl, (proxyRes) => {
    const statusCode = proxyRes.statusCode || 502;
    const headers = {
      'Content-Type': proxyRes.headers['content-type'] || 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    res.writeHead(statusCode, headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (error) => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Unable to reach Google Sheet endpoint.', details: error.message }));
  });
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (requestUrl.pathname === '/api/roadtrip') {
    proxyRoadtrip(req, res);
    return;
  }

  const filePath = requestUrl.pathname === '/' ? '/roadtrip/index.html' : requestUrl.pathname;
  const safePath = path.normalize(decodeURIComponent(filePath)).replace(/^\/+/, '');
  const absolutePath = path.join(__dirname, safePath);

  if (!absolutePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
    readStaticFile(res, absolutePath);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Roadtrip proxy server running at http://localhost:${PORT}`);
});
