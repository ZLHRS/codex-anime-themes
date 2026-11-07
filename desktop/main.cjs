const {app,BrowserWindow,ipcMain,dialog,Tray,Menu,shell,nativeImage} = require('electron');
const fs=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const core=require('./core.cjs');
const root=path.resolve(__dirname,'..');
let window,tray,settings={},settingsFile,catalog=[],timer,busy=false,cached,status='Выберите тему — она сохранится для следующих запусков.',quitting=false;
const smoke=process.argv.includes('--smoke-test');
if(smoke)app.setPath('userData',path.join(app.getPath('temp'),'zlhrs-smoke-'+process.pid));
const launchOnly=process.argv.includes('--launch');
const ownsLock=smoke || app.requestSingleInstanceLock();
if(!ownsLock)app.quit();
else {
app.on('second-instance',(_event,args)=>{if(args.includes('--launch'))apply(settings.theme).catch(report);else show();});
app.on('before-quit',()=>{quitting=true;clearInterval(timer);});
app.on('window-all-closed',()=>{});
app.on('activate',show);
app.whenReady().then(init).catch(error=>{if(smoke){console.error(error);app.exit(1);}else{dialog.showErrorBox('ZLHRS Theme Studio',error.message);app.quit();}});
}
function report(error){status=error.message;notify();}
function snapshot(){return {themes:catalog,selected:settings.theme,appPath:settings.appPath||'',status,platform:process.platform,version:app.getVersion()};}
function notify(){if(window&&!window.isDestroyed())window.webContents.send('studio:state',snapshot());}
function show(){if(window&&!window.isDestroyed()){window.show();window.focus();}else createWindow();}
function createWindow(){
 window=new BrowserWindow({width:1180,height:850,minWidth:850,minHeight:620,title:'ZLHRS Theme Studio',backgroundColor:'#0e1017',icon:path.join(root,'assets/studio.ico'),show:false,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 window.setMenuBarVisibility(false);
 window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 window.webContents.on('will-navigate',event=>event.preventDefault());
 window.on('close',event=>{if(!quitting&&!smoke&&tray){event.preventDefault();window.hide();}});
 window.once('ready-to-show',()=>window.show());
 window.loadFile(path.join(__dirname,'index.html'));
 return window;
}
async function init(){
 settingsFile=path.join(app.getPath('userData'),'settings.json');
 try{settings=await core.readJson(settingsFile);}catch{}
 if(!settings.theme&&process.platform==='win32')try{settings.theme=(await core.readJson(path.join(process.env.LOCALAPPDATA,'ZLHRS/ThemeStudio/.selected-theme.json'))).theme;}catch{}
 catalog=await core.readJson(path.join(root,'catalog.json'));
 catalog=await Promise.all(catalog.map(async t=>({...await core.readJson(path.join(root,'themes',t.id,'theme.json')),preview:pathToFileURL(path.join(root,'previews',t.id+'-chat.jpg')).href})));
 if(!catalog.some(t=>t.id===settings.theme))settings.theme=catalog[0].id;
 if(!await core.exists(settings.appPath))settings.appPath=await core.discover();
 const {session}=require('electron');session.defaultSession.setPermissionRequestHandler((_wc,_p,callback)=>callback(false));
 ipcMain.handle('studio:state',()=>snapshot());
 ipcMain.handle('studio:apply',async(_e,id)=>{try{await apply(id);return snapshot();}catch(e){report(e);return snapshot();}});
 ipcMain.handle('studio:choose',async()=>{
  const result=await dialog.showOpenDialog(window,{title:'Выберите приложение ChatGPT / Codex',properties:['openFile'],filters:process.platform==='win32'?[{name:'Приложение',extensions:['exe']}]:undefined});
  if(!result.canceled){settings.appPath=result.filePaths[0];await core.saveSettings(settingsFile,settings);status='Приложение выбрано. Можно применить тему.';notify();}return snapshot();
 });
 ipcMain.handle('studio:shortcut',async()=>{try{await shortcut();status='Ярлык «ChatGPT с темой» создан на рабочем столе.';}catch(e){status=e.message;}notify();return snapshot();});
 ipcMain.handle('studio:quit',()=>app.quit());
 if(smoke){
  const w=createWindow();await new Promise(resolve=>w.webContents.once('did-finish-load',resolve));
  const count=await w.webContents.executeJavaScript('document.querySelectorAll(".card").length');
  // Renderer fetches the catalog asynchronously.
  for(let i=0;i<30;i++){if(await w.webContents.executeJavaScript('document.querySelectorAll(".card").length')===16){
   const found=await w.webContents.executeJavaScript(`(()=>{const s=document.getElementById('search');s.value='tatsumaki';s.dispatchEvent(new Event('input'));const count=document.querySelectorAll('.card').length;s.value='';s.dispatchEvent(new Event('input'));document.querySelector('.preview-button').click();const modal=document.getElementById('preview').open;document.getElementById('close-preview').click();return {count,modal};})()`);
   if(found.count!==2||!found.modal)throw new Error('Search or preview failed');
   if(process.argv.includes('--screenshot')){await w.webContents.executeJavaScript('Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))');await fs.writeFile(path.join(root,'docs/theme-selector-crossplatform.png'),(await w.webContents.capturePage()).toPNG());}
   app.exit(0);return;
  }await new Promise(r=>setTimeout(r,100));}
  throw new Error('Gallery smoke test failed: '+count);
 }
 const icon=nativeImage.createFromPath(path.join(root,'assets/studio-logo.png')).resize({width:22,height:22});
 tray=new Tray(icon);tray.setToolTip('ZLHRS Theme Studio');tray.setContextMenu(Menu.buildFromTemplate([{label:'Выбрать тему',click:show},{label:'Открыть ChatGPT',click:()=>apply(settings.theme).catch(report)},{type:'separator'},{label:'Выйти',click:()=>app.quit()}]));tray.on('click',show);
 if(app.isPackaged&&settings.shortcutFor!==process.execPath){try{await shortcut();settings.shortcutFor=process.execPath;await core.saveSettings(settingsFile,settings);}catch(error){report(error);}}
 if(launchOnly){try{await apply(settings.theme);}catch(e){report(e);show();}}else show();
}
async function apply(id){
 if(!catalog.some(t=>t.id===id))throw new Error('Неизвестная тема.');
 if(busy)throw new Error('Дождитесь завершения текущего переключения.');
 busy=true;
 try{
  settings.theme=id;await core.saveSettings(settingsFile,settings);
  if(process.platform==='win32'){
   const legacy=path.join(process.env.LOCALAPPDATA,'ZLHRS/ThemeStudio/.selected-theme.json');
   if(await core.exists(legacy))await core.saveSettings(legacy,{theme:id});
  }
  cached=await core.payload(root,id);notify();
  let list=[];try{list=await core.targets();}catch{}
  if(!list.length){await core.launch(settings.appPath);for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,500));try{list=await core.targets();if(list.length)break;}catch{}}}
  if(!list.length)throw new Error('Тема сохранена. Полностью закройте ChatGPT и откройте его кнопкой здесь. Если не помогает, выбранная сборка приложения несовместима.');
  await tick();clearInterval(timer);timer=setInterval(()=>tick().catch(report),2500);
  status='Тема применена. Запускайте ChatGPT ярлыком «ChatGPT с темой». После закрытия окна Studio остаётся в трее.';
  notify();
 }finally{busy=false;}
}
let ticking=false;
async function tick(){
 if(ticking||!cached)return;ticking=true;
 try{const list=await core.targets();for(const target of list){const state=await core.evaluate(target.webSocketDebuggerUrl,'({stamp:window.__CODEX_THEME_STUDIO__?.stamp,ready:!!document.body})');if(state?.ready&&state.stamp!==cached.stamp){const result=await core.evaluate(target.webSocketDebuggerUrl,cached.expression);if(!result?.installed)throw new Error('Приложение не подтвердило применение темы.');}}}finally{ticking=false;}
}
function shQuote(value){return "'"+value.replaceAll("'","'\\''")+"'";}
async function shortcut(){
 if(!app.isPackaged)throw new Error('Создание ярлыка доступно в установленной сборке.');
 const exe=process.env.APPIMAGE||process.execPath;
 const desktop=app.getPath('desktop');
 if(process.platform==='win32'){
  const ok=shell.writeShortcutLink(path.join(desktop,'ChatGPT с темой.lnk'),'create',{target:exe,args:'--launch',description:'ChatGPT с последней темой ZLHRS',icon:exe,iconIndex:0});if(!ok)throw new Error('Не удалось создать ярлык.');
 }else if(process.platform==='linux'){
  const icon=path.join(app.getPath('userData'),'studio.png');await fs.copyFile(path.join(root,'assets/studio-logo.png'),icon);
  const quoted='"'+exe.replace(/[\\"`$]/g,'\\$&').replaceAll('%','%%')+'"';
  const entry='[Desktop Entry]\nType=Application\nName=ChatGPT с темой\nExec='+quoted+' --launch\nIcon='+icon+'\nTerminal=false\nCategories=Utility;\n';
  await fs.mkdir(desktop,{recursive:true});await fs.writeFile(path.join(desktop,'ChatGPT-with-theme.desktop'),entry,{mode:0o755});
  const applications=path.join(process.env.XDG_DATA_HOME||path.join(app.getPath('home'),'.local/share'),'applications');await fs.mkdir(applications,{recursive:true});await fs.writeFile(path.join(applications,'zlhrs-chatgpt.desktop'),entry,{mode:0o755});
 }else{
  const bundle=path.join(desktop,'ChatGPT с темой.app','Contents');await fs.mkdir(path.join(bundle,'MacOS'),{recursive:true});
  await fs.writeFile(path.join(bundle,'Info.plist'),'<?xml version="1.0"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>CFBundleExecutable</key><string>launch</string><key>CFBundleIdentifier</key><string>com.zlhrs.chatgpt-launcher</string><key>CFBundleName</key><string>ChatGPT с темой</string><key>CFBundlePackageType</key><string>APPL</string></dict></plist>');
  await fs.writeFile(path.join(bundle,'MacOS/launch'),'#!/bin/sh\nexec '+shQuote(exe)+' --launch\n',{mode:0o755});
 }
}
