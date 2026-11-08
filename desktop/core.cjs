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
async function payload(root, id, appearance, themeRoot=root) {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)) throw new Error('Invalid theme ID');
  const dir = path.join(themeRoot, 'themes', id);
  const theme = await readJson(path.join(dir, 'theme.json'));
  if (theme.id !== id) throw new Error('Theme ID mismatch');
  let vars = '';
  for (const [name, file] of Object.entries(theme.assets || {})) {
    if (!/^[\w-]+$/.test(name)) throw new Error('Invalid asset name');
    const mime = {'.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'}[path.extname(file)];
    if (!mime) throw new Error('Invalid image type');
    vars += `--cts-asset-${name}:url("data:${mime};base64,${(await fs.readFile(inside(dir,file))).toString('base64')}");`;
  }
  const enhancement=require('./appearance.cjs').compose(id,appearance);
  const css = `:root.codex-theme-studio{${vars}}` + await fs.readFile(inside(dir, theme.css), 'utf8') + enhancement.css;
  const helpers = (await fs.readFile(path.join(root,'runtime/composer-overflow.mjs'),'utf8')).replaceAll('export function ','function ');
  const template = await fs.readFile(path.join(root,'runtime/theme-runtime.js'),'utf8');
  const stamp = 'pack:' + id + ':' + crypto.createHash('sha256').update(css).update(template).update(helpers).update(enhancement.chrome).digest('hex').slice(0,16).toUpperCase();
  const replacements = {
    __CTS_COMPOSER_OVERFLOW_HELPERS__: `(()=>{${helpers};return {clearComposerSurfaceCompat,createComposerOverflowAnnotator,reconcileComposerSurfaces,selectComposerSurfaces};})()`,
    __CTS_CSS_JSON__: JSON.stringify(css), __CTS_THEME_JSON__: JSON.stringify(theme),
    __CTS_CHROME_JSON__: JSON.stringify(enhancement.chrome), __CTS_MOTION_JSON__: '{}',
    __CTS_VERSION_JSON__: '"studio-2.0.0"', __CTS_STAMP_JSON__: JSON.stringify(stamp)
  };
  return {stamp, expression: template.replace(/__CTS_[A-Z_]+__/g, key => {
    if (!(key in replacements)) throw new Error('Unknown runtime token');
    return replacements[key];
  })};
}
function validTarget(target) {
  if(target.type !== 'page')return false;
  try{const u=new URL(target.url);return u.protocol==='app:'&&u.hostname==='-'&&['/index.html','/detached-window.html'].includes(u.pathname)&&!decodeURIComponent(u.search).includes('avatar-overlay');}catch{return false;}
}
const LOOPBACK=['127.0.0.1','[::1]','localhost'];
let debugPort=9345;
function setDebugPort(port){if(!Number.isInteger(port)||port<9345||port>9445)throw new Error('Invalid debugging port');debugPort=port;}
async function freeDebugPort(){
 const net=require('node:net');
 const available=(port,host)=>new Promise(resolve=>{const server=net.createServer();server.once('error',e=>resolve(e.code==='EAFNOSUPPORT'||e.code==='EADDRNOTAVAIL'));server.listen({port,host,ipv6Only:true},()=>server.close(()=>resolve(true)));});
 for(let port=9345;port<=9445;port++)if(await available(port,'127.0.0.1')&&await available(port,'::1'))return port;
 throw new Error('Нет свободного локального порта для темы.');
}
async function closeRunning(file){
 if(process.platform!=='win32')return;
 const directory=await fs.mkdtemp(path.join(require('node:os').tmpdir(),'zlhrs-close-'));
 try{const helper=path.join(directory,'close-app.ps1');await fs.writeFile(helper,await fs.readFile(path.join(__dirname,'close-app.ps1')));await run('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',helper,'-AppPath',file],{windowsHide:true,timeout:25000});}catch{throw new Error('Не удалось перезапустить выбранное приложение. Убедитесь, что ChatGPT и Studio запущены от одного пользователя и без разных прав администратора.');}finally{await fs.rm(directory,{recursive:true,force:true});}
}
let preferredHost='127.0.0.1';
async function targets(request=fetch) {
  let connected=false;
  for(const host of [...new Set([preferredHost,...LOOPBACK])]) {
    try{
      const r=await request(`http://${host}:${debugPort}/json/list`,{signal:AbortSignal.timeout(1200)});
      if(!r.ok)continue;
      const list=await r.json();if(!Array.isArray(list))continue;
      connected=true;
      const pages=list.filter(validTarget).map(t=>{
        const socket=new URL(t.webSocketDebuggerUrl);
        if(socket.protocol!=='ws:'||!LOOPBACK.includes(socket.hostname)||socket.port!==String(debugPort))throw new Error('Unexpected debugging endpoint');
        socket.hostname=host;return {...t,webSocketDebuggerUrl:socket.href};
      });
      if(pages.length){preferredHost=host;return pages;}
    }catch{}
  }
  if(connected)return [];
  throw new Error('Не удалось подключиться к ChatGPT. Полностью закройте его и откройте через Theme Studio.');
}
function command(url, method, params) {
  const uri = new URL(url);
  if (uri.protocol !== 'ws:' || !LOOPBACK.includes(uri.hostname) || uri.port !== String(debugPort)) throw new Error('Unexpected debugging endpoint');
  return new Promise((resolve,reject) => {
    const ws = new WebSocket(url); let done = false;
    const finish = (error,value) => {if(done)return;done=true;clearTimeout(timer);ws.close();error?reject(error):resolve(value);};
    const timer = setTimeout(()=>finish(new Error('ChatGPT не отвечает.')),12000);
    ws.addEventListener('error',()=>finish(new Error('Соединение с ChatGPT прервано.')));
    ws.addEventListener('close',()=>finish(new Error('Окно ChatGPT закрылось.')));
    ws.addEventListener('open',()=>ws.send(JSON.stringify({id:1,method,params})));
    ws.addEventListener('message',event=>{try{const r=JSON.parse(event.data);if(r.id!==1)return;
      if(r.error||r.result?.exceptionDetails)finish(new Error('Не удалось применить тему.'));
      else finish(null,r.result);
    }catch(e){finish(e);}});
  });
}
function evaluate(url,expression){return command(url,'Runtime.evaluate',{expression,returnByValue:true}).then(r=>r?.result?.value);}
async function foreground(target){
  const url=target.webSocketDebuggerUrl;
  try{const info=await command(url,'Browser.getWindowForTarget',{});if(info.bounds?.windowState==='minimized')await command(url,'Browser.setWindowBounds',{windowId:info.windowId,bounds:{windowState:'normal'}});}catch{}
  await command(url,'Page.bringToFront',{});
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
  const flags=['--remote-debugging-address=127.0.0.1','--remote-debugging-port='+debugPort];
  return platform==='darwin' && file.endsWith('.app') ? {command:'/usr/bin/open',args:['-a',file,'--args',...flags]} : {command:file,args:flags};
}
async function launch(file) {
  if(!await exists(file))throw new Error('ChatGPT не найден. Нажмите «Выбрать приложение».');
  const spec=launchSpec(file);
  await new Promise((resolve,reject)=>{const child=spawn(spec.command,spec.args,{detached:true,stdio:'ignore',windowsHide:false});child.once('error',reject);child.once('spawn',()=>{child.unref();resolve();});});
}
module.exports={setDebugPort,freeDebugPort,closeRunning,readJson,exists,inside,payload,validTarget,targets,evaluate,command,foreground,saveSettings,discover,launchSpec,launch};
