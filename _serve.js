const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3098;
const ROOT = path.join(__dirname);
const DESKTOP = path.join(__dirname, '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8'
};

http.createServer((req, res) => {
  let filePath = path.join(ROOT, req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
  const ext = path.extname(filePath).toLowerCase();
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // 바탕화면 폴더 fallback (신입/관리자/db영업전문과과정/재무설계 등)
      const desktopPath = path.join(DESKTOP, decodeURIComponent(req.url.split('?')[0]));
      fs.readFile(desktopPath, (err2, data2) => {
        if (!err2) {
          res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
          res.end(data2);
          return;
        }
        // SPA fallback
        if (ext === '' || ext === '.html') {
          fs.readFile(path.join(ROOT, 'index.html'), (e3, d3) => {
            if (e3) { res.writeHead(404); res.end('Not Found'); return; }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(d3);
          });
          return;
        }
        res.writeHead(404); res.end('Not Found'); return;
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => console.log('AI Branch server on port ' + PORT));
