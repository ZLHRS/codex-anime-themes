const {app,BrowserWindow}=require('electron');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),up=path.join(root,'output/claude-desktop-themes-upstream');
const dir=path.join(root,'dist/claude-code-2.6.11');
const read=p=>fs.readFileSync(p,'utf8');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1400,height:900,webPreferences:{backgroundThrottling:false}});
 await w.loadURL('about:blank');const run=s=>w.webContents.executeJavaScript(s);
 await run(`document.body.innerHTML='<style>body{margin:0;font:16px Segoe UI;color:var(--cds-text-primary)}main{height:100vh;margin-left:220px}aside{position:absolute;inset:0 auto 0 0;width:180px;padding:20px}.text{margin:0 auto;width:54%;padding-top:140px;line-height:1.8}.bg-surface-3{position:absolute;bottom:40px;left:36%;width:40%;padding:24px;border-radius:18px}</style><aside class="dframe-sidebar"><b>Claude · Code</b><p>New session</p><p>Themes</p></aside><main class="dframe-content"><div class="text"><h1>ZLHRS · Theme preview</h1><p>Colors and original artwork adapted for Claude Code.</p><p>This is a rendering fixture, not the installed Claude application.</p><p>Readable conversation, unobstructed controls.</p></div><div data-cds="ChatComposer"><div class="bg-surface-3"><button id="send">Send</button> Message Claude…</div></div></main>';void 0;`);
 let engine=read(path.join(up,'extension/src/engine.js'));
 engine=engine.slice(0,engine.indexOf('// A person'));
 const core=read(path.join(up,'extension/src/core.js'));
 await run('(()=>{'+core+'\n'+engine+'\nwindow.testPaint=paint;window.testScenes=SCENES;window.testRoot=root;})();');
 const helpers=read(path.join(root,'runtime/ascii/helpers.js'));
 for(const file of fs.readdirSync(path.join(dir,'themes')).filter(f=>f.endsWith('.js'))){
  const id=file.slice(0,-3);
  await run('(()=>{const root=window.testRoot;'+helpers+'\n'+read(path.join(dir,'themes',file))+'\nwindow.testScenes['+JSON.stringify(id)+']=SCENES['+JSON.stringify(id)+'];})();');
 }
 const inventory=JSON.parse(read(path.join(dir,'inventory.json')));
 for(const item of inventory.themes){
  const t=JSON.parse(read(path.join(dir,'themes',item.id+'.json')));
  t.css=read(path.join(up,'themes/_base.css'))+'\n'+(t.wallpaper?read(path.join(up,'themes/_wallpaper.css')):'')+'\n'+read(path.join(dir,'themes',item.id+'.css'));
  await run('window.testPaint('+JSON.stringify(t)+');void 0;');
  assert.equal(await run('document.documentElement.dataset.desktopTheme'),item.id);
  for(const match of t.css.matchAll(/url\("(data:[^"]+)"\)/g))await run('(async()=>{const i=new Image();i.src='+JSON.stringify(match[1])+';await i.decode();if(!i.naturalWidth)throw Error("Empty artwork");return true})()');
  assert.equal(await run('document.getElementById("send")===document.elementFromPoint(document.getElementById("send").getBoundingClientRect().x+5,document.getElementById("send").getBoundingClientRect().y+5)'),true,item.id+' controls remain clickable');
  if(['zlhrs-azure-morpho','zlhrs-tidal-halo-duo','zlhrs-ascii-moonlit'].includes(item.id))fs.writeFileSync(path.join(root,'output',item.id+'-claude-preview.png'),(await w.webContents.capturePage()).toPNG());
 }
 await run('window.testPaint({});void 0;');assert.equal(await run('document.querySelectorAll("#desktop-theme-wallpaper").length'),0);
 console.log('PASS: all 99 themes rendered, embedded images decoded, controls clickable; reset removes wallpaper.');app.exit(0);
}).catch(e=>{console.error(e);app.exit(1)});
