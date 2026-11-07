const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFile, spawn} = require('node:child_process');
const {promisify} = require('node:util');
const run = promisify(execFile);
const readJson = async file => JSON.parse((await fs.readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
const exists = async file => !!file && fs.access(file).then(() => true, () => false);
function inside(root, relative) {
  const result = path.resolve(root, relative);
  if (!result.startsWith(path.resolve(root) + path.sep)) throw new Error('Invalid theme asset path');
  return result;
}
async function payload(root, id) {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)) throw new Error('Invalid theme ID');
  const dir = path.join(root, 'themes', id);
  const theme = await readJson(path.join(dir, 'theme.json'));
  if (theme.id !== id) throw new Error('Theme ID mismatch');
  let vars = '';
  for (const [name, file] of Object.entries(theme.assets || {})) {
    if (!/^[\w-]+$/.test(name)) throw new Error('Invalid asset name');
    const mime = {'.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'}[path.extname(file)];
    if (!mime) throw new Error('Invalid image type');
    vars += `--cts-asset-${name}:url("data:${mime};base64,${(await fs.readFile(inside(dir,file))).toString('base64')}");`;
  }
  const css = `:root.codex-theme-studio{${vars}}` + await fs.readFile(inside(dir, theme.css), 'utf8');
  const helpers = (await fs.readFile(path.join(root,'launcher/composer-overflow.mjs'),'utf8')).replaceAll('export function ','function ');
  const stamp = 'pack:' + id + ':' + crypto.createHash('sha256').update(css).digest('hex').slice(0,16).toUpperCase();
  const replacements = {
    __CTS_COMPOSER_OVERFLOW_HELPERS__: `(()=>{${helpers};return {clearComposerSurfaceCompat,createComposerOverflowAnnotator,reconcileComposerSurfaces,selectComposerSurfaces};})()`,
    __CTS_CSS_JSON__: JSON.stringify(css), __CTS_THEME_JSON__: JSON.stringify(theme),
    __CTS_CHROME_JSON__: 'null', __CTS_MOTION_JSON__: '{}',
    __CTS_VERSION_JSON__: '"studio-2.0.0"', __CTS_STAMP_JSON__: JSON.stringify(stamp)
  };
  const template = await fs.readFile(path.join(root,'launcher/theme-runtime.js'),'utf8');
  return {stamp, expression: template.replace(/__CTS_[A-Z_]+__/g, key => {
    if (!(key in replacements)) throw new Error('Unknown runtime token');
    return replacements[key];
  })};
}
function validTarget(target) {
  return target.type === 'page' && /^app:\/\/-\/(index|detached-window)\.html(?:[?#]|$)/.test(target.url || '');
}
async function targets() {
  const r = await fetch('http://127.0.0.1:9345/json/list', {signal: AbortSignal.timeout(2000)});
  if (!r.ok) throw new Error('Подключение к ChatGPT недоступно.');
  const list = await r.json();
  if (!Array.isArray(list)) throw new Error('Неподдерживаемый ответ приложения.');
  return list.filter(validTarget);
}
function evaluate(url, expression) {
  const uri = new URL(url);
  if (uri.protocol !== 'ws:' || uri.hostname !== '127.0.0.1' || uri.port !== '9345') throw new Error('Unexpected debugging endpoint');
  return new Promise((resolve,reject) => {
    const ws = new WebSocket(url); let done = false;
    const finish = (error,value) => {if(done)return;done=true;clearTimeout(timer);ws.close();error?reject(error):resolve(value);};
    const timer = setTimeout(()=>finish(new Error('ChatGPT не отвечает.')),12000);
    ws.addEventListener('error',()=>finish(new Error('Соединение с ChatGPT прервано.')));
    ws.addEventListener('open',()=>ws.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression,returnByValue:true}})));
    ws.addEventListener('message',event=>{try{const r=JSON.parse(event.data);if(r.id!==1)return;
      if(r.error||r.result?.exceptionDetails)finish(new Error('Не удалось применить тему.'));
      else finish(null,r.result?.result?.value);
    }catch(e){finish(e);}});
  });
}
async function saveSettings(file, value) {
  await fs.mkdir(path.dirname(file),{recursive:true});
  const temp=file+'.tmp';await fs.writeFile(temp,JSON.stringify(value,null,2));await fs.rename(temp,file);
}
async function discover(platform=process.platform, home=require('node:os').homedir()) {
  if(platform==='win32') {
    try {const {stdout}=await run('powershell.exe',['-NoProfile','-NonInteractive','-Command',"[Console]::OutputEncoding=[Text.UTF8Encoding]::new();(Get-AppxPackage -Name OpenAI.Codex | Select-Object -First 1).InstallLocation"],{windowsHide:true});
      const file=path.join(stdout.trim(),'app','ChatGPT.exe');if(await exists(file))return file;
    }catch{}
  }
  const candidates = platform==='darwin' ? ['/Applications/ChatGPT.app','/Applications/Codex.app',path.join(home,'Applications/ChatGPT.app'),path.join(home,'Applications/Codex.app')] : platform==='linux' ? ['/opt/ChatGPT/chatgpt','/opt/chatgpt/chatgpt','/opt/ChatGPT/ChatGPT','/opt/Codex/codex','/usr/bin/chatgpt','/usr/bin/codex-desktop'] : [];
  for(const candidate of candidates)if(await exists(candidate))return candidate;
  return '';
}
function launchSpec(file, platform=process.platform) {
  if(!path.isAbsolute(file))throw new Error('Выберите полный путь к приложению.');
  const flags=['--remote-debugging-address=127.0.0.1','--remote-debugging-port=9345'];
  return platform==='darwin' && file.endsWith('.app') ? {command:'/usr/bin/open',args:['-a',file,'--args',...flags]} : {command:file,args:flags};
}
async function launch(file) {
  if(!await exists(file))throw new Error('ChatGPT не найден. Нажмите «Выбрать приложение».');
  const spec=launchSpec(file);
  await new Promise((resolve,reject)=>{const child=spawn(spec.command,spec.args,{detached:true,stdio:'ignore',windowsHide:true});child.once('error',reject);child.once('spawn',()=>{child.unref();resolve();});});
}
module.exports={readJson,exists,inside,payload,validTarget,targets,evaluate,saveSettings,discover,launchSpec,launch};
