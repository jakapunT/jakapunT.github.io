// npm run dev: build into .preview/, serve it on localhost, rebuild and reload on save.
// Each rebuild runs in a fresh process so edits to src/ are picked up too.
//
// The preview can also edit the lecture Markdown (templates/dev-edit.js):
//   GET  /__source  → the raw lines of one block
//   POST /__save    → replace those lines, after checking the file still parses
//   POST /__open    → open the file at a line in VS Code
// These exist only here, on 127.0.0.1, and only touch .md files under course/courses/.
// Published pages have no editor and no server to talk to.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { COURSE_DIR } from './page.mjs';
// parse.mjs is imported fresh for each save (see loadParser), so rule changes apply without a restart

const PORT = Number(process.env.PORT ?? 5180);
const PREVIEW = path.join(COURSE_DIR, '.preview');
const SOURCES = path.join(COURSE_DIR, 'courses');
const HISTORY = path.join(PREVIEW, '.history');
const clients = new Set();

const broadcast = (msg) => { for (const res of clients) res.write(`data: ${msg}\n\n`); };

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
    if (code === 0) broadcast('reload');
    else broadcast(`error ${JSON.stringify(err.trim().split('\n')[0] || 'build failed')}`);
    if (again) { again = false; rebuild(); }
  });
}

// ---------------------------------------------------------------- editing

// Builds run in a fresh process, but this server lives on. Import the parser anew each time so a
// save is checked with the same rules the next build will use.
const loadParser = async () => (await import(`./parse.mjs?v=${Date.now()}`)).parseLecture;
const loadFresh = async (name) => import(`./${name}?v=${Date.now()}`);

// course/.env, read on every request so adding ANTHROPIC_API_KEY needs no restart. Never logged.
function readDotEnv() {
  const file = path.join(COURSE_DIR, '.env');
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return env;
}

class EditError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// Only lecture Markdown under course/courses/ may be read or written.
function sourcePath(rel) {
  const abs = path.resolve(COURSE_DIR, String(rel ?? ''));
  if (!abs.startsWith(SOURCES + path.sep) || !abs.endsWith('.md') || !fs.existsSync(abs)) {
    throw new EditError(400, 'not a lecture file');
  }
  return abs;
}

function lineRange(body) {
  const start = Number(body.start);
  const end = Number(body.end);
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start) throw new EditError(400, 'bad line range');
  return [start, end];
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 2e6) reject(new EditError(413, 'too large')); });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { reject(new EditError(400, 'bad JSON')); } });
  });
}

// A page on another site could try to POST to localhost. Browsers only send the custom
// header after a CORS preflight, which this server never approves, so requiring it plus a
// localhost Origin blocks that.
function checkCaller(req) {
  const origin = req.headers.origin;
  const okOrigin = !origin || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
  if (req.headers['x-course-dev'] !== '1' || !okOrigin) throw new EditError(403, 'forbidden');
}

function backup(abs, text) {
  fs.mkdirSync(HISTORY, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const name = `${path.relative(SOURCES, abs).replace(/[\\/]/g, '__')}.${stamp}.md`;
  fs.writeFileSync(path.join(HISTORY, name), text);
  // keep the newest 200 versions
  const all = fs.readdirSync(HISTORY).sort();
  for (const old of all.slice(0, Math.max(0, all.length - 200))) fs.rmSync(path.join(HISTORY, old));
  return name;
}

async function handleEdit(req, res, url) {
  const send = (status, obj) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(obj));
  };
  try {
    if (url.pathname === '/__source' && req.method === 'GET') {
      checkCaller(req);
      const abs = sourcePath(url.searchParams.get('file'));
      const [start, end] = lineRange({ start: url.searchParams.get('start'), end: url.searchParams.get('end') });
      const lines = fs.readFileSync(abs, 'utf8').split('\n');
      if (end > lines.length) throw new EditError(409, 'the file changed; reload the page');
      return send(200, { text: lines.slice(start - 1, end).join('\n') });
    }

    if (url.pathname === '/__save' && req.method === 'POST') {
      checkCaller(req);
      const body = await readBody(req);
      const abs = sourcePath(body.file);
      const [start, end] = lineRange(body);
      const before = fs.readFileSync(abs, 'utf8');
      const lines = before.split('\n');
      if (lines.slice(start - 1, end).join('\n') !== body.original) {
        throw new EditError(409, 'These lines changed since you opened them (edited somewhere else?). Reload the page and try again.');
      }
      const text = String(body.text ?? '').replace(/\r\n?/g, '\n').replace(/\n+$/, '');
      const after = [...lines.slice(0, start - 1), ...(text === '' ? [] : text.split('\n')), ...lines.slice(end)].join('\n');
      if (after === before) return send(200, { ok: true, unchanged: true });

      // refuse anything that would break the build or drop a section ID
      const rel = path.relative(COURSE_DIR, abs);
      const parseLecture = await loadParser();
      let parsed;
      try {
        parsed = parseLecture(after, rel);
      } catch (e) {
        throw new EditError(422, `Not saved: ${e.message}`);
      }
      const oldIds = parseLecture(before, rel).sections.map((s) => s.id);
      const newIds = new Set(parsed.sections.map((s) => s.id));
      const lost = oldIds.filter((id) => !newIds.has(id));
      if (lost.length) throw new EditError(422, `Not saved: section ${lost.map((x) => x.toUpperCase()).join(', ')} would disappear. Remove sections in VS Code if you mean it.`);

      const saved = backup(abs, before);
      const write = (text) => {
        const tmp = `${abs}.saving`;
        fs.writeFileSync(tmp, text);
        fs.renameSync(tmp, abs);
      };
      write(after);
      console.log(`edited ${rel} lines ${start}-${end} (previous version: .preview/.history/${saved})`);

      // keep the English in step with the Thai
      if (!body.translate) return send(200, { ok: true });
      const { translationBackend, translateToEnglish } = await loadFresh('translate.mjs');
      const dotenv = readDotEnv();
      if (!translationBackend(dotenv)) return send(200, { ok: true, englishError: 'no translator: install Claude Code, or set ANTHROPIC_API_KEY in course/.env' });
      try {
        const { syncEnglish } = await loadFresh('sync-english.mjs');
        const result = await syncEnglish({
          before,
          after,
          file: rel,
          parseLecture,
          translate: (args) => translateToEnglish({ ...args, dotenv }),
        });
        if (result.done.length) {
          if (fs.readFileSync(abs, 'utf8') !== after) throw new Error('the file changed while translating; English not written');
          write(result.text);
          console.log(`  ${result.done.join('; ')}`);
        }
        return send(200, { ok: true, english: result.done });
      } catch (e) {
        console.warn(`  English not updated: ${e.message}`);
        return send(200, { ok: true, englishError: e.message });
      }
    }

    if (url.pathname === '/__config' && req.method === 'GET') {
      checkCaller(req);
      const { translationBackend } = await loadFresh('translate.mjs');
      return send(200, { translate: Boolean(translationBackend(readDotEnv())) });
    }

    if (url.pathname === '/__open' && req.method === 'POST') {
      checkCaller(req);
      const body = await readBody(req);
      const abs = sourcePath(body.file);
      const line = Math.max(1, Number(body.line) || 1);
      spawn('open', [`vscode://file${encodeURI(abs)}:${line}`], { stdio: 'ignore', detached: true }).unref();
      return send(200, { ok: true });
    }
    return send(404, { error: 'not found' });
  } catch (e) {
    return send(e.status ?? 500, { error: e.message });
  }
}

// ---------------------------------------------------------------- server

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };

http
  .createServer((req, res) => {
    const parsedUrl = new URL(req.url, 'http://x');
    const url = decodeURIComponent(parsedUrl.pathname);
    if (url === '/__reload') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      res.write(': connected\n\n');
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    if (url === '/__source' || url === '/__save' || url === '/__open' || url === '/__config') {
      handleEdit(req, res, parsedUrl);
      return;
    }
    let file = path.join(PREVIEW, url);
    if (!file.startsWith(PREVIEW) || url.includes('/.history')) { res.writeHead(403).end(); return; }
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
    console.log(`Preview: http://localhost:${PORT}/   (✎ Edit and ⌥-click to open in VS Code are on)`);
  });

let timer;
for (const p of ['courses', 'templates', 'src', 'tokens.css']) {
  const full = path.join(COURSE_DIR, p);
  if (!fs.existsSync(full)) continue;
  fs.watch(full, { recursive: true }, (event, name) => {
    if (name && name.endsWith('.saving')) return;
    clearTimeout(timer);
    timer = setTimeout(rebuild, 120);
  });
}
rebuild();
