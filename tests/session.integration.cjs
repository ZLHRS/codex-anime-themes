const test=require('node:test');const assert=require('node:assert/strict');const path=require('node:path');const {spawn}=require('node:child_process');
const fs=require('node:fs/promises');const os=require('node:os');
const core=require('../desktop/core.cjs');const {ThemeSession,PROBE}=require('../desktop/theme-session.cjs');const root=path.resolve(__dirname,'..');
test('real Chromium: cold startup, all themes, detached windows, reload, restart and saved selection', {timeout:120000},async()=>{
 const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'zlhrs-lifecycle-'));assert.equal(path.dirname(temporary),os.tmpdir());
 const port=await core.freeDebugPort();core.setDebugPort(port);
 let child;const start=()=>{child=spawn(require('electron'),[path.join(__dirname,'fixture.cjs'),...(process.platform==='linux'?['--no-sandbox']:[])],{stdio:'ignore',env:{...process.env,ZLHRS_TEST_PORT:String(port)}});};
 const stop=async()=>{if(child&&child.exitCode===null&&child.signalCode===null){const done=new Promise(resolve=>child.once('exit',resolve));child.kill();await done;}};
 const ready=async()=>{for(let i=0;i<100;i++){try{const pages=await core.targets();if(pages.length===2&&(await Promise.all(pages.map(p=>core.evaluate(p.webSocketDebuggerUrl,'window.__STUDIO_TEST_FIXTURE__')))).every(Boolean))return pages;}catch{}await new Promise(r=>setTimeout(r,100));}throw Error('Isolated fixture not ready; refusing to test against any user app');};
 try{
  start();let pages=await ready();const s=new ThemeSession(root);const catalog=await core.readJson(path.join(root,'catalog.json'));
  for(const item of catalog){await s.select(item.id);assert.equal((await s.reconcile()).applied,2);for(const p of pages){const state=await core.evaluate(p.webSocketDebuggerUrl,PROBE);assert.equal(state.theme,item.id);assert(state.styled);const footer=await core.evaluate(p.webSocketDebuggerUrl,`({fade:getComputedStyle(document.getElementById('fixture-footer-fade')).display,spacer:document.getElementById('fixture-footer-spacer').getBoundingClientRect().height,other:getComputedStyle(document.getElementById('fixture-other-layer')).display})`);assert.equal(footer.fade,'none');assert.equal(footer.spacer,120);assert.notEqual(footer.other,'none');const readability=await core.evaluate(p.webSocketDebuggerUrl,`(()=>{const answer=getComputedStyle(document.getElementById('fixture-answer'));const code=document.getElementById('fixture-code');return {padding:answer.paddingLeft,backdrop:answer.backgroundSize,pre:getComputedStyle(code.closest('pre')).backgroundColor,code:getComputedStyle(code).backgroundColor,syntax:getComputedStyle(code.firstElementChild).color};})()`);assert.equal(readability.padding,'24px',item.id);assert.equal(readability.backdrop,'100% 100%',item.id);assert.equal(readability.pre,'rgb(37, 37, 37)',item.id);assert.equal(readability.code,'rgba(0, 0, 0, 0)',item.id);assert.equal(readability.syntax,'rgb(0, 200, 0)',item.id);}}
  await s.select('furina-moonlit-repose',{brightness:130,size:120,x:-10,y:5,animations:false});await s.reconcile();
  const appearance=await core.evaluate(pages[0].webSocketDebuggerUrl,`(()=>{const n=document.querySelector('main.main-surface'),p=getComputedStyle(n,'::before');return {filter:p.filter,scale:p.scale,transform:p.transform,stages:document.querySelectorAll('#cts-stage').length,animation:getComputedStyle(document.querySelector('.cts-atmosphere')).animationName,pointer:getComputedStyle(document.querySelector('#cts-stage')).pointerEvents}})()`);
  assert.equal(appearance.filter,'brightness(1.3)');assert.equal(appearance.scale,'1.2');assert.notEqual(appearance.transform,'none');assert.equal(appearance.stages,1);assert.equal(appearance.animation,'none');assert.equal(appearance.pointer,'none');
  await s.select('furina-moonlit-repose',{effects:false});await s.reconcile();assert.equal(await core.evaluate(pages[0].webSocketDebuggerUrl,"document.querySelectorAll('#cts-stage').length"),0);
  await s.select(catalog.at(-1).id);await s.reconcile();
  const last=catalog.at(-1).id;const settings=path.join(temporary,'settings.json');await core.saveSettings(settings,{theme:last});
  await core.command(pages[0].webSocketDebuggerUrl,'Page.reload',{});await new Promise(r=>setTimeout(r,150));await s.waitForApplied();assert.equal((await core.evaluate(pages[0].webSocketDebuggerUrl,PROBE)).theme,last);
  await stop();await assert.rejects(s.reconcile());start();pages=await ready();const restored=new ThemeSession(root);await restored.select((await core.readJson(settings)).theme);await restored.waitForApplied();assert.equal((await core.evaluate(pages[0].webSocketDebuggerUrl,PROBE)).theme,last);
 }finally{await stop();await fs.rm(temporary,{recursive:true});}
});

test('Windows restart closes a background instance and restores the selected theme', {skip:process.platform!=='win32',timeout:60000},async()=>{
 const executable=require('electron');let child;let stopped;
 const start=(file,env={})=>{child=spawn(executable,[path.join(__dirname,file)],{stdio:['ignore','pipe','ignore'],env:{...process.env,...env}});stopped=new Promise(resolve=>child.once('exit',resolve));return child;};
 try{
  const background=start('background-app.cjs');
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Background fixture not ready')),15000);background.stdout.on('data',data=>{if(String(data).includes('BACKGROUND_READY')){clearTimeout(timer);resolve();}});});
  await core.closeRunning(executable);await stopped;assert.notEqual(background.exitCode,null);
  const port=await core.freeDebugPort();core.setDebugPort(port);start('fixture.cjs',{ZLHRS_TEST_PORT:String(port)});
  const session=new ThemeSession(root);await session.select('fubuki-velvet');
  for(let i=0;i<100;i++){let pages=[];try{pages=await core.targets();}catch{}if(pages.length===2&&(await Promise.all(pages.map(p=>core.evaluate(p.webSocketDebuggerUrl,'window.__STUDIO_TEST_FIXTURE__')))).every(Boolean)){await session.waitForApplied();assert.equal((await core.evaluate(pages[0].webSocketDebuggerUrl,PROBE)).theme,'fubuki-velvet');return;}await new Promise(r=>setTimeout(r,100));}
  throw Error('Restarted fixture not ready');
 }finally{if(child&&child.exitCode===null){child.kill();await stopped;}}
});
