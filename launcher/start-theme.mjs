// Uses the v0.5.17 Codex App Manager renderer runtime (see LICENSE).
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const home = process.env.USERPROFILE;
const settingsPath = path.join(home, 'AppData/Roaming/wangnov/codexappmanager/data/settings.json');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function evaluate(target, expression) {
  const url = new URL(target.webSocketDebuggerUrl);
  if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.port !== '9345') {
    throw new Error('Unexpected theme connection');
  }
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    const timer = setTimeout(() => finish(new Error('Theme connection timed out')), 15000);
    function finish(error, result) {
      clearTimeout(timer);
      socket.close();
      error ? reject(error) : resolve(result);
    }
    socket.addEventListener('error', () => finish(new Error('Theme connection failed')));
    socket.addEventListener('open', () => socket.send(JSON.stringify({
      id: 1, method: 'Runtime.evaluate', params: { expression, returnByValue: true },
    })));
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id !== 1) return;
      if (message.error || message.result?.exceptionDetails) {
        finish(new Error('Theme runtime failed'));
      } else {
        finish(null, message.result.result.value);
      }
    });
  });
}

async function buildPayload() {
  const settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
  const id = settings.codexTheme;
  if (!id) return null;
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)) throw new Error('Invalid theme ID');
  const root = path.resolve(settings.codexThemeStoreDir);
  const folder = path.join(root, id);
  const theme = JSON.parse(await fs.readFile(path.join(folder, 'theme.json'), 'utf8'));
  if (theme.id !== id) throw new Error('Theme ID mismatch');
  const readAsset = async relative => {
    const resolved = path.resolve(folder, relative);
    if (!resolved.startsWith(folder + path.sep)) throw new Error('Invalid theme asset');
    return fs.readFile(resolved);
  };
  const mimeTypes = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
  const assets = [];
  for (const [name, relative] of Object.entries(theme.assets ?? {})) {
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) throw new Error('Invalid asset name');
    const mime = mimeTypes[path.extname(relative).toLowerCase()];
    if (!mime) throw new Error('Unsupported asset format');
    const data = await readAsset(relative);
    assets.push(`--cts-asset-${name}:url("data:${mime};base64,${data.toString('base64')}");`);
  }
  const hardening = `
html.codex-theme-studio [data-cts-composer-overflow="shell"] { overflow:clip!important; overflow-clip-margin:64px!important; }
html.codex-theme-studio [data-cts-composer-overflow="lane"] { overflow:visible!important; }
html.codex-theme-studio [data-cts-composer-overflow="editor"] { overflow-x:hidden!important; overflow-y:auto!important; overscroll-behavior:contain!important; }
`;
  const css = `:root.codex-theme-studio{${assets.join('')}}\n${await readAsset(theme.css)}\n${hardening}`;
  const module = (await fs.readFile(path.join(directory, 'composer-overflow.mjs'), 'utf8'))
    .replaceAll('export function ', 'function ');
  const helpers = `(()=>{${module};return {clearComposerSurfaceCompat,createComposerOverflowAnnotator,reconcileComposerSurfaces,selectComposerSurfaces};})()`;
  const replacements = {
    __CTS_COMPOSER_OVERFLOW_HELPERS__: helpers,
    __CTS_CSS_JSON__: JSON.stringify(css),
    __CTS_THEME_JSON__: JSON.stringify(theme),
    __CTS_CHROME_JSON__: 'null',
    __CTS_MOTION_JSON__: '{}',
    __CTS_VERSION_JSON__: JSON.stringify('0.5.17-compatible-launch'),
    __CTS_STAMP_JSON__: JSON.stringify(`compatible-launch-v14:${id}`),
  };
  const template = await fs.readFile(path.join(directory, 'theme-runtime.js'), 'utf8');
  return template.replace(/__CTS_[A-Z_]+__/g, token => replacements[token] ?? token);
}

const handled = new Set();
if (process.argv.includes('--check')) {
  new Function(await buildPayload());
  console.log('Theme payload validated');
  process.exit(0);
}
if (process.argv.includes('--verify')) {
  const targets = await (await fetch('http://127.0.0.1:9345/json/list')).json();
  for (const target of targets.filter(item => item.type === 'page' && item.url === 'app://-/index.html')) {
    console.log(await evaluate(target, `({theme: window.__CODEX_THEME_STUDIO__?.themeId, portrait: getComputedStyle(document.documentElement).getPropertyValue('--cts-asset-portrait').startsWith('url('), active: document.documentElement.classList.contains('codex-theme-studio')})`));
  }
  process.exit(0);
}
if (process.argv.includes('--apply-once')) {
  const targets = await (await fetch('http://127.0.0.1:9345/json/list')).json();
  const target = targets.find(item => item.type === 'page' && item.url === 'app://-/index.html');
  if (!target) throw new Error('ChatGPT window unavailable');
  console.log(await evaluate(target, await buildPayload()));
  process.exit(0);
}
let missing = 0;
while (missing < 15) {
  try {
    const response = await fetch('http://127.0.0.1:9345/json/list', { signal: AbortSignal.timeout(2000) });
    if (!response.ok) throw new Error('Theme endpoint unavailable');
    const targets = await response.json();
    missing = 0;
    for (const target of targets) {
      if (target.type !== 'page' || !/^app:\/\/-\/(index|detached-window)\.html(?:\?|$)/.test(target.url)) continue;
      if (target.url.includes('avatar-overlay') || handled.has(target.id)) continue;
      const state = await evaluate(target, `({ theme: window.__CODEX_THEME_STUDIO__?.themeId, disabled: !!window.__CODEX_THEME_STUDIO_DISABLED__, ready: !!document.body })`);
      if (state.theme || state.disabled) {
        handled.add(target.id);
        continue;
      }
      if (!state.ready) continue;
      const payload = await buildPayload();
      if (payload) {
        const result = await evaluate(target, payload);
        if (!result?.installed) continue;
      }
      handled.add(target.id);
    }
  } catch (error) {
    missing++;
    if (missing === 15) console.error(error.message);
  }
  await sleep(2000);
}
