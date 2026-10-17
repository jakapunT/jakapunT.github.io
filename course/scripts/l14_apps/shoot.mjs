// Takes a real screenshot of a running Streamlit app with headless Chrome (DevTools protocol),
// waiting until the app has finished running, not just loaded.
//   node shoot.mjs <url> <out.png> <width> <height> [extra wait ms, for slow online apps]
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const [url, out, w = '1280', h = '900', extra = '0'] = process.argv.slice(2);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, '--hide-scrollbars',
  `--window-size=${w},${h}`, '--user-data-dir=/tmp/l14-chrome-' + port, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const waiting = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (waiting.has(m.id)) { waiting.get(m.id)(m.result); waiting.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { waiting.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });

await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 2, mobile: false });
await send('Page.navigate', { url });
// done = the app's main block has rendered elements and Streamlit says it is no longer running
const ready = `(() => {
  const app = document.querySelector('[data-testid="stMainBlockContainer"], [data-testid="block-container"]');
  const busy = document.querySelector('[data-testid="stStatusWidget"]');
  const skeleton = document.querySelector('[data-testid="stSkeleton"], [data-testid="stAppSkeleton"]');
  return !!app && app.querySelectorAll('[data-testid="stElementContainer"], .element-container').length > 0 && !busy && !skeleton;
})()`;
for (let i = 0; i < 120; i++) {
  const r = await send('Runtime.evaluate', { expression: ready, returnByValue: true });
  if (r?.result?.value) break;
  await sleep(250);
}
await sleep(1500 + Number(extra)); // charts animate in; online apps may still be loading
const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log('wrote', out);
ws.close(); chrome.kill();
process.exit(0);
