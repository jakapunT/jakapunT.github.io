// npm run dev: build into .preview/, serve it on localhost, rebuild and reload on save.
// Each rebuild runs in a fresh process so edits to src/ are picked up too.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { COURSE_DIR } from './page.mjs';

const PORT = Number(process.env.PORT ?? 5180);
const PREVIEW = path.join(COURSE_DIR, '.preview');
const clients = new Set();

let building = false;
let again = false;
function rebuild() {
  if (building) { again = true; return; }
  building = true;
  const child = spawn(process.execPath, [path.join(COURSE_DIR, 'src/build.mjs')], {
    env: { ...process.env, COURSE_DEV: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let err = '';
  child.stdout.on('data', (d) => process.stdout.write(d));
  child.stderr.on('data', (d) => { err += d; process.stderr.write(d); });
  child.on('close', (code) => {
    building = false;
    if (code === 0) for (const res of clients) res.write('data: reload\n\n');
    else for (const res of clients) res.write(`data: error\n\n`);
    if (again) { again = false; rebuild(); }
  });
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };

http
  .createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (url === '/__reload') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      res.write(': connected\n\n');
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    let file = path.join(PREVIEW, url);
    if (!file.startsWith(PREVIEW)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (url === '/') {
      const courses = fs.existsSync(PREVIEW) ? fs.readdirSync(PREVIEW).filter((d) => !d.startsWith('_') && !d.startsWith('.')) : [];
      res.writeHead(200, { 'Content-Type': TYPES['.html'] });
      res.end(`<!doctype html><meta charset="utf-8"><title>Course preview</title><ul>${courses.map((c) => `<li><a href="/${c}/">${c}</a></li>`).join('')}</ul>`);
      return;
    }
    fs.readFile(file, (e, data) => {
      if (e) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found'); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(data);
    });
  })
  .listen(PORT, '127.0.0.1', () => {
    console.log(`Preview: http://localhost:${PORT}/`);
  });

let timer;
for (const p of ['courses', 'templates', 'src', 'tokens.css']) {
  const full = path.join(COURSE_DIR, p);
  if (!fs.existsSync(full)) continue;
  fs.watch(full, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 120);
  });
}
rebuild();
