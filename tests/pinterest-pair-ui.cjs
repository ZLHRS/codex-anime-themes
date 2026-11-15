const {app,BrowserWindow}=require('electron');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1600,height:1000,webPreferences:{backgroundThrottling:false}});
 const run=s=>w.webContents.executeJavaScript(s);
 for(const [id,width,height] of [['ai-violet-starlight',3840,2160],['zero-two-azure-bounce',3840,2160]]){
  await w.loadURL('about:blank');
  await run(`document.write('<style>html,body{margin:0;height:100%;font:16px Segoe UI}main{height:100%;position:relative}.content{position:relative;z-index:1;padding:70px 0 0 6%;width:37%;line-height:1.65}.composer-surface-chrome{position:absolute;z-index:1;bottom:35px;left:6%;width:34%;padding:24px}</style><main class="main-surface" data-app-shell-main-surface><div class="content"><div data-local-conversation-final-assistant><div data-markdown-text-style><h2>${id.startsWith('ai-')?'Violet Starlight':'Azure Bounce'}</h2><p>Your conversation, in a new atmosphere.</p><p>Original animation, smooth motion and a clear, continuous background.</p></div></div></div><div class="composer-surface-chrome">Message ChatGPT…</div></main>');document.close();document.hasFocus=()=>true;void 0;`);
  await run((await require('../desktop/core.cjs').payload(root,id)).expression);
  await run(`new Promise((resolve,reject)=>{let n=0;const check=()=>{const v=document.querySelector('video');if(v?.currentTime>.3)resolve();else if(++n>120)reject(Error('Video did not play'));else setTimeout(check,100)};check()})`);
  const result=await run(`(()=>{const v=document.querySelector('video');return {width:v.videoWidth,height:v.videoHeight,muted:v.muted,count:document.querySelectorAll('video').length}})()`);
  assert.equal(result.width,width);assert.equal(result.height,height);assert.equal(result.muted,true);assert.equal(result.count,1);
  fs.writeFileSync(path.join(root,'previews',id+'-chat.jpg'),(await w.webContents.capturePage()).toJPEG(92));
  await new Promise(r=>setTimeout(r,4000));
  console.log('Playback quality',id,await run(`(()=>{const v=document.querySelector('video'),q=v.getVideoPlaybackQuality();return {time:v.currentTime,decoded:q.totalVideoFrames,dropped:q.droppedVideoFrames}})()`));
  await run(`window.dispatchEvent(new Event('blur'))`);assert.equal(await run(`document.querySelector('video').paused`),true);
  await run(`window.dispatchEvent(new Event('focus'))`);
  await new Promise(r=>setTimeout(r,300));assert.equal(await run(`document.querySelector('video').paused`),false);
  await run(`window.__CODEX_THEME_STUDIO__.cleanup()`);assert.equal(await run(`document.querySelectorAll('video').length`),0);
  console.log(id,result,'playback, pause, resume and cleanup passed');
 }
 app.exit(0);
}).catch(e=>{console.error(e);app.exit(1)});
