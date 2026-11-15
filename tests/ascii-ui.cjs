const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),core=require('../desktop/core.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1500,height:900,webPreferences:{backgroundThrottling:false}});
 await w.loadURL('about:blank');const run=s=>w.webContents.executeJavaScript(s);
 await run(`document.write('<style>html,body{margin:0;height:100%;font:16px Segoe UI}main{height:100%;position:relative}.content{position:relative;margin:auto;width:48%;padding-top:100px;line-height:1.7}.composer-surface-chrome{position:absolute!important;bottom:35px;left:26%;width:44%;padding:24px;border-radius:16px}</style><main data-app-shell-main-surface class="main-surface"><div class="content"><h1>Live ASCII wallpapers</h1><p>Original scenes by 0toshigami · MIT</p><p>Small worlds. A space for your thoughts.</p></div><div class="composer-surface-chrome">Message ChatGPT…</div></main>');document.close();document.hasFocus=()=>true;void 0;`);
 const errors=[];w.webContents.on('console-message',(_e,...args)=>{if(String(args).includes('Error'))errors.push(String(args));});
 const ids=fs.readdirSync(path.join(root,'themes')).filter(x=>x.startsWith('ascii-'));
 for(const id of ids){
  await run((await core.payload(root,id)).expression);await wait(180);
  assert.equal(await run(`document.querySelectorAll('.cts-ascii-wallpaper').length`),1,id);
  assert.equal(await run(`document.querySelector('.cts-ascii-wallpaper').dataset.running`),'true',id);
  const a=await run(`document.querySelector('canvas').toDataURL()`);await wait(140);
  const b=await run(`document.querySelector('canvas').toDataURL()`);assert.notEqual(a,b,id+' animates');
  await run(`window.dispatchEvent(new Event('blur'))`);const paused=await run(`document.querySelector('canvas').toDataURL()`);await wait(100);
  assert.equal(await run(`document.querySelector('canvas').toDataURL()`),paused,id+' pauses');
  await run(`window.__CODEX_THEME_STUDIO__.ensure();window.__CODEX_THEME_STUDIO__.ensure()`);
  assert.equal(await run(`document.querySelectorAll('.cts-ascii-wallpaper').length`),1);
  fs.writeFileSync(path.join(root,'previews',id+'-chat.jpg'),(await w.webContents.capturePage()).toJPEG(88));
  await run(`window.dispatchEvent(new Event('focus'))`);
  console.log('PASS',id);
 }
 await run((await core.payload(root,'ascii-moonlit',{animations:false,ascii:{motion:'grid',speed:2,cell:14,veil:.5}})).expression);await wait(100);
 assert.equal(await run(`document.querySelector('canvas').dataset.running`),'false');
 await run((await core.payload(root,'ascii-moonlit')).expression);await wait(100);
 w.webContents.debugger.attach('1.3');
 await w.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await w.webContents.capturePage({},{stayHidden:true,stayAwake:true});await wait(150);
 assert.equal(await run(`document.querySelector('canvas').dataset.running`),'false');
 w.webContents.debugger.detach();
 await run((await core.payload(root,'midnight-grid')).expression);
 assert.equal(await run(`document.querySelectorAll('.cts-ascii-wallpaper').length`),0);
 assert.deepEqual(errors,[]);console.log('ASCII lifecycle, settings, reduced motion and cleanup passed.');app.exit(0);
}).catch(e=>{console.error(e);app.exit(1)});
