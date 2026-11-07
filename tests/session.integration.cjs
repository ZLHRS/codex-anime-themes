const test=require('node:test');const assert=require('node:assert/strict');const path=require('node:path');const {spawn}=require('node:child_process');
const fs=require('node:fs/promises');const os=require('node:os');
const core=require('../desktop/core.cjs');const {ThemeSession,PROBE}=require('../desktop/theme-session.cjs');const root=path.resolve(__dirname,'..');
test('real Chromium: cold startup, all themes, detached windows, reload, restart and saved selection', {timeout:120000},async()=>{
 const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'zlhrs-lifecycle-'));assert.equal(path.dirname(temporary),os.tmpdir());
 let child;const start=()=>{child=spawn(require('electron'),[path.join(__dirname,'fixture.cjs'),...(process.platform==='linux'?['--no-sandbox']:[])],{stdio:'ignore'});};
 const stop=async()=>{if(child&&child.exitCode===null&&child.signalCode===null){const done=new Promise(resolve=>child.once('exit',resolve));child.kill();await done;}};
 const ready=async()=>{for(let i=0;i<100;i++){try{const pages=await core.targets();if(pages.length===2&&(await Promise.all(pages.map(p=>core.evaluate(p.webSocketDebuggerUrl,'window.__STUDIO_TEST_FIXTURE__')))).every(Boolean))return pages;}catch{}await new Promise(r=>setTimeout(r,100));}throw Error('Isolated fixture not ready; refusing to test against any user app');};
 try{
  start();let pages=await ready();const s=new ThemeSession(root);const catalog=await core.readJson(path.join(root,'catalog.json'));
  for(const item of catalog){await s.select(item.id);assert.equal((await s.reconcile()).applied,2);for(const p of pages){const state=await core.evaluate(p.webSocketDebuggerUrl,PROBE);assert.equal(state.theme,item.id);assert(state.styled);}}
  const last=catalog.at(-1).id;const settings=path.join(temporary,'settings.json');await core.saveSettings(settings,{theme:last});
  await core.command(pages[0].webSocketDebuggerUrl,'Page.reload',{});await new Promise(r=>setTimeout(r,150));await s.waitForApplied();assert.equal((await core.evaluate(pages[0].webSocketDebuggerUrl,PROBE)).theme,last);
  await stop();await assert.rejects(s.reconcile());start();pages=await ready();const restored=new ThemeSession(root);await restored.select((await core.readJson(settings)).theme);await restored.waitForApplied();assert.equal((await core.evaluate(pages[0].webSocketDebuggerUrl,PROBE)).theme,last);
 }finally{await stop();await fs.rm(temporary,{recursive:true});}
});
