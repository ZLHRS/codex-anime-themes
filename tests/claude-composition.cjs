const {app,BrowserWindow}=require('electron');const fs=require('fs'),fsp=require('fs/promises'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url');
const root=path.resolve(__dirname,'..'),slot=path.join(root,'output/claude-composition-assets');
app.whenReady().then(async()=>{
 fs.mkdirSync(slot,{recursive:true});const catalog=JSON.parse(fs.readFileSync(path.join(root,'catalog.json'),'utf8'));
 const source=new BrowserWindow({show:false,webPreferences:{backgroundThrottling:false}}),target=new BrowserWindow({show:false,webPreferences:{backgroundThrottling:false}});
 const fixture=path.join(slot,'fixture.html');fs.writeFileSync(fixture,'<!doctype html><html><body></body></html>');
 const helper=fs.readFileSync(path.join(root,'desktop/claude-artwork.js'),'utf8').replace("if(!/^https:\\/\\/claude\\.ai(?:\\/|$)/.test(location.href))return;",'');
 const props=['width','height','left','right','top','bottom','backgroundImage','backgroundPosition','backgroundSize','backgroundRepeat','transform','transformOrigin','scale','translate','opacity','maskImage','maskComposite','filter','aspectRatio'];
 const inspect=(shadow)=>`(()=>{const el=${shadow?'document.querySelector("#zlhrs-claude-artwork").shadowRoot.querySelector(".main-surface")':'document.querySelector(".main-surface")'};return [null,'::before','::after'].map(p=>{const s=getComputedStyle(el,p);return Object.fromEntries(${JSON.stringify(props)}.map(k=>[k,s[k]]));});})()`;
 let count=0;const selected=['kana-soft-garnet','kana-ruby-spotlight','furina-moonlit-repose','tatsumaki-jade-duo','crimson-heart-duo','tidal-halo-duo'];
 for(const entry of catalog){
  if(process.env.CLAUDE_LAYOUT_SMOKE&&!selected.includes(entry.id))continue;
  const t=JSON.parse(fs.readFileSync(path.join(root,entry.path,'theme.json'),'utf8'));if(t.ascii)continue;
  const scene=await require('../desktop/claude-scene.cjs').scene(root,slot,entry,{effects:false});
  const index={_scenes:{['zlhrs-'+t.id]:scene}};
  const vars=Object.entries(scene.files).map(([k,v])=>`--cts-asset-${k}:url("${pathToFileURL(path.join(slot,v)).href}");`).join('');
  const css='html.codex-theme-studio{'+vars+'--app-shell-titlebar-height:38px}'+fs.readFileSync(path.join(root,entry.path,t.css),'utf8')+require('../desktop/appearance.cjs').compose(t.id,{effects:false}).css;
  for(const [width,height] of [[1200,800],[800,600],[1600,900]]){
   source.setContentSize(width,height);target.setContentSize(width,height);
   await source.loadFile(fixture);await target.loadFile(fixture);
   const base='html,body{margin:0;width:100%;height:100%;overflow:hidden}.main-surface{position:relative;isolation:isolate;width:calc(100% - 200px);height:100%;margin-left:200px;box-sizing:border-box}';
   await source.webContents.executeJavaScript(`document.documentElement.className='codex-theme-studio';document.body.innerHTML='<div class="main-surface"></div>';let st=document.createElement('style');st.textContent=${JSON.stringify(base+css)};document.head.append(st);`);
   await target.webContents.executeJavaScript(`document.body.innerHTML='<aside style="position:fixed;left:0;top:0;width:200px;height:100vh"></aside>';window.chrome={runtime:{getURL:p=>${JSON.stringify(pathToFileURL(slot+path.sep).href)}+p}};window.fetch=async()=>({text:async()=>${JSON.stringify(JSON.stringify(index))}});document.documentElement.dataset.desktopTheme=${JSON.stringify('zlhrs-'+t.id)};${helper}`);
   await target.webContents.executeJavaScript('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
   const a=await source.webContents.executeJavaScript(inspect(false)),b=await target.webContents.executeJavaScript(inspect(true));
   assert.deepEqual(b,a,t.id+' '+width+' composition differs');
   await target.webContents.executeJavaScript(`document.body.insertAdjacentHTML('beforeend','<aside role="complementary" style="position:fixed;right:0;top:38px;width:260px;height:calc(100vh - 38px);background:#123"></aside>');new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
   assert.deepEqual(await target.webContents.executeJavaScript(inspect(true)),b,t.id+' moved with right panel');
   if(width===1200&&selected.includes(t.id)){await target.webContents.executeJavaScript('Promise.all([...document.querySelector("#zlhrs-claude-artwork").shadowRoot.querySelectorAll("style")].map(()=>new Promise(r=>setTimeout(r,100))))');fs.writeFileSync(path.join(slot,t.id+'.png'),(await target.webContents.capturePage()).toPNG());}
   await target.webContents.executeJavaScript("document.documentElement.removeAttribute('data-desktop-theme');new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))");
   assert.equal(await target.webContents.executeJavaScript("document.querySelector('#zlhrs-claude-artwork').shadowRoot.childElementCount"),0,'stock reset clears scene');
   assert.equal(await target.webContents.executeJavaScript("document.querySelectorAll('[data-zlhrs-right-panel]').length"),0,'stock reset restores panel');
   count++;
  }
 }
 console.log('PASS: '+count+' source/Claude comparisons; complete computed artwork geometry, transforms, masks, opacity, all backgrounds and panel invariance.');app.exit(0);
}).catch(e=>{console.error(e);app.exit(1)});
