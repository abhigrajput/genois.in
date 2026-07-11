// Minimal Chrome DevTools Protocol driver for smoke tests — dependency-free.
// Uses Node's built-in global WebSocket (Node >= 22), so nothing to install.
// Just needs a Chrome/Chromium binary on the machine.
import { spawn } from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export { sleep };

// Locate a Chrome/Chromium binary: honor $CHROME_BIN, else probe common paths.
export function findChrome() {
  const envBin = process.env.CHROME_BIN;
  const candidates = [
    envBin,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch { /* ignore */ }
  }
  throw new Error('Chrome not found. Set CHROME_BIN to your Chrome/Chromium executable.');
}

const waitPort = (port) => new Promise((res, rej) => {
  const t0 = Date.now();
  const tick = () => {
    const s = net.connect(port, '127.0.0.1');
    s.on('connect', () => { s.destroy(); res(); });
    s.on('error', () => { s.destroy(); Date.now() - t0 > 15000 ? rej(new Error('Chrome debug port never opened')) : setTimeout(tick, 200); });
  };
  tick();
});

// A single attached page target. `route()` registers ONE request handler that
// the Fetch domain consults for every intercepted request.
export class Session {
  constructor() {
    this._id = 0;
    this._pending = new Map();
    this._events = new Map(); // method -> Set<handler>
    this._router = null;
    this.ws = null;
    this.chrome = null;
    this._port = 0;
  }

  static async launch({ headful = false, base = 9333 } = {}) {
    const s = new Session();
    // Random-ish port to allow parallel/repeat runs without collisions.
    s._port = base + Math.floor(Math.random() * 400);
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'smoke-chrome-'));
    s._profile = profile;
    const args = [
      headful ? '--headless=false' : '--headless=new',
      `--remote-debugging-port=${s._port}`,
      '--remote-allow-origins=*',       // native WebSocket sends an Origin; allow it
      `--user-data-dir=${profile}`,
      '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
      '--window-size=1200,900',
    ];
    s.chrome = spawn(findChrome(), args, { stdio: 'ignore' });
    await waitPort(s._port);
    const target = await (await fetch(`http://127.0.0.1:${s._port}/json/new?about:blank`, { method: 'PUT' })).json();
    s.ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      s.ws.addEventListener('open', res, { once: true });
      s.ws.addEventListener('error', () => rej(new Error('CDP websocket failed to open')), { once: true });
    });
    s.ws.addEventListener('message', (ev) => s._onMessage(ev.data));
    return s;
  }

  _onMessage(raw) {
    const m = JSON.parse(raw);
    if (m.id && this._pending.has(m.id)) {
      const { resolve } = this._pending.get(m.id);
      this._pending.delete(m.id);
      resolve(m.result ?? {});
      return;
    }
    if (m.method === 'Fetch.requestPaused') { this._onPaused(m.params); return; }
    const set = this._events.get(m.method);
    if (set) for (const h of set) h(m.params);
  }

  send(method, params = {}) {
    const id = ++this._id;
    return new Promise((resolve) => {
      this._pending.set(id, { resolve });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, handler) {
    if (!this._events.has(method)) this._events.set(method, new Set());
    this._events.get(method).add(handler);
  }

  // Turn on the domains a smoke needs. Pass `intercept: false` to skip Fetch.
  async ready({ intercept = true } = {}) {
    await this.send('Page.enable');
    await this.send('Runtime.enable');
    await this.send('Network.enable');
    if (intercept) await this.send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  }

  // Register the request router. `fn({url, method})` returns:
  //   { fulfill: { status?, json?, body?, headers? } }  -> respond
  //   { hang: true }                                      -> leave paused (forces client timeout)
  //   falsy                                               -> continue to the network
  route(fn) { this._router = fn; }

  async _onPaused({ requestId, request }) {
    let action;
    try { action = this._router ? this._router({ url: request.url, method: request.method }) : null; } catch { action = null; }
    try {
      if (action?.hang) return; // deliberately never respond
      if (action?.fulfill) {
        const f = action.fulfill;
        const bodyStr = f.json !== undefined ? JSON.stringify(f.json) : (f.body ?? '');
        const headers = f.headers ?? [{ name: 'content-type', value: 'application/json' }];
        await this.send('Fetch.fulfillRequest', {
          requestId,
          responseCode: f.status ?? 200,
          responseHeaders: headers,
          body: Buffer.from(bodyStr).toString('base64'),
        });
        return;
      }
      await this.send('Fetch.continueRequest', { requestId });
    } catch {
      try { await this.send('Fetch.continueRequest', { requestId }); } catch { /* target gone */ }
    }
  }

  async setCookie(name, value, base) {
    await this.send('Network.setCookie', { name, value, url: base + '/', secure: base.startsWith('https'), sameSite: 'Lax' });
  }

  async seedLocalStorage(key, value) {
    await this.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `try{localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)})}catch(e){}`,
    });
  }

  async navigate(url) { await this.send('Page.navigate', { url }); }

  async eval(expr) {
    const r = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true });
    return r.result?.value;
  }

  // Poll an expression until it's truthy or the timeout elapses.
  async waitFor(expr, { timeout = 10000, interval = 300 } = {}) {
    const t0 = Date.now();
    for (;;) {
      if (await this.eval(expr)) return true;
      if (Date.now() - t0 > timeout) return false;
      await sleep(interval);
    }
  }

  // Click the element whose textContent matches `re`. Prefers real interactive
  // controls (button/a/[role=button]); only then falls back to divs (for cards
  // that attach onClick to a plain div). For div fallback it clicks the DEEPEST
  // match so the native click bubbles up to the onClick handler. Returns true if
  // something was clicked.
  async clickByText(re, { leafOnly = false } = {}) {
    const cond = leafOnly ? 'el.children.length===0 &&' : 'true &&';
    return this.eval(`(()=>{const rx=${re.toString()};
      const btn=[...document.querySelectorAll('button,a,[role="button"]')].find(el=>rx.test((el.textContent||'').trim()));
      if(btn){btn.click();return true;}
      const divs=[...document.querySelectorAll('div')].filter(el=>${cond} rx.test((el.textContent||'').trim()));
      if(divs.length){divs[divs.length-1].click();return true;}
      return false;})()`);
  }

  async text() { return (await this.eval('document.body.innerText')) || ''; }

  async screenshot(file) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const r = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
  }

  async close() {
    try { this.ws?.close(); } catch { /* ignore */ }
    try { this.chrome?.kill(); } catch { /* ignore */ }
    await sleep(200);
    try { fs.rmSync(this._profile, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}
