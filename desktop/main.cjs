const {app,BrowserWindow,ipcMain,dialog,Tray,Menu,shell,nativeImage} = require('electron');
const fs=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const core=require('./core.cjs');
const updates=require('./updates.cjs');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
let window,tray,settings={},settingsFile,catalog=[],timer,busy=false,cached,status='Выберите тему — она сохранится для следующих запусков.',quitting=false,lastShortcut='',updating=false;
const smoke=process.argv.includes('--smoke-test');
if(smoke){const temp=path.join(app.getPath('temp'),'zlhrs-smoke-'+process.pid);app.setPath('userData',temp);require('node:fs').mkdirSync(path.join(temp,'Desktop'),{recursive:true});app.setPath('desktop',path.join(temp,'Desktop'));}
const launchOnly=process.argv.includes('--launch');
const portable=process.platform==='win32'&&require('node:fs').existsSync(path.join(path.dirname(process.execPath),'PORTABLE'));
const ownsLock=smoke || app.requestSingleInstanceLock();
if(!ownsLock)app.quit();
else {
app.on('second-instance',(_event,args)=>{if(args.includes('--quit-for-update')){app.quit();return;}if(args.includes('--launch'))apply(settings.theme,true).catch(report);else show();});
app.on('before-quit',()=>{quitting=true;clearInterval(timer);});
app.on('window-all-closed',()=>{});
app.on('activate',show);
app.whenReady().then(init).catch(error=>{if(smoke){console.error(error);app.exit(1);}else{dialog.showErrorBox('ZLHRS Theme Studio',error.message);app.quit();}});
}
function report(error){status=error.message;notify();}
function snapshot(){return {themes:catalog,selected:settings.theme,appPath:settings.appPath||'',status,platform:process.platform,version:app.getVersion(),lastShortcut,updating};}
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
 const updateResult=path.join(app.getPath('userData'),'update-result.txt');
 try{status=await fs.readFile(updateResult,'utf8');await fs.unlink(updateResult);}catch{}
 try{settings=await core.readJson(settingsFile);}catch{}
 if(!settings.theme&&process.platform==='win32')try{settings.theme=(await core.readJson(path.join(process.env.LOCALAPPDATA,'ZLHRS/ThemeStudio/.selected-theme.json'))).theme;}catch{}
 catalog=await core.readJson(path.join(root,'catalog.json'));
 catalog=await Promise.all(catalog.map(async t=>({...await core.readJson(path.join(root,'themes',t.id,'theme.json')),preview:pathToFileURL(path.join(root,'previews',t.id+'-chat.jpg')).href})));
 if(!catalog.some(t=>t.id===settings.theme))settings.theme=catalog[0].id;
 if(!await core.exists(settings.appPath))settings.appPath=await core.discover();
 const {session}=require('electron');session.defaultSession.setPermissionRequestHandler((_wc,_p,callback)=>callback(false));
 ipcMain.handle('studio:state',()=>snapshot());
 ipcMain.handle('studio:apply',async(_e,id)=>{try{await apply(id);return snapshot();}catch(e){report(e);return snapshot();}});
 ipcMain.handle('studio:launch',async()=>{try{await apply(settings.theme,true);return snapshot();}catch(e){report(e);return snapshot();}});
 ipcMain.handle('studio:choose',async()=>{
  const result=await dialog.showOpenDialog(window,{title:'Выберите приложение ChatGPT / Codex',properties:['openFile'],filters:process.platform==='win32'?[{name:'Приложение',extensions:['exe']}]:undefined});
  if(!result.canceled){settings.appPath=result.filePaths[0];await core.saveSettings(settingsFile,settings);status='Приложение выбрано. Можно применить тему.';notify();}return snapshot();
 });
 ipcMain.handle('studio:shortcut',async()=>{try{lastShortcut=await shortcut();status='Готово: «ChatGPT с темой» на рабочем столе. Нажмите «Показать ярлык», чтобы его найти.';}catch(e){status='Не удалось создать ярлык: '+e.message;}notify();return snapshot();});
 ipcMain.handle('studio:reveal',()=>{if(lastShortcut)shell.showItemInFolder(lastShortcut);});
 ipcMain.handle('studio:update',async()=>{try{await updateApp();}catch(e){updating=false;report(e);}return snapshot();});
 ipcMain.handle('studio:quit',()=>app.quit());
 if(smoke){
  let launches=0,focuses=0;
  core.launch=async()=>{launches++;};core.foreground=async()=>{focuses++;};core.targets=async()=>[{type:'page',url:'app://-/index.html',webSocketDebuggerUrl:'ws://127.0.0.1:9345/test'}];core.evaluate=async()=>({stamp:cached?.stamp,ready:true});
  const w=createWindow();await new Promise(resolve=>w.webContents.once('did-finish-load',resolve));
  const count=await w.webContents.executeJavaScript('document.querySelectorAll(".card").length');
  // Renderer fetches the catalog asynchronously.
  for(let i=0;i<30;i++){if(await w.webContents.executeJavaScript('document.querySelectorAll(".card").length')===16){
   const found=await w.webContents.executeJavaScript(`(()=>{const s=document.getElementById('search');s.value='tatsumaki';s.dispatchEvent(new Event('input'));const count=document.querySelectorAll('.card').length;s.value='';s.dispatchEvent(new Event('input'));document.querySelector('.preview-button').click();const modal=document.getElementById('preview').open;document.getElementById('close-preview').click();return {count,modal};})()`);
   if(found.count!==2||!found.modal)throw new Error('Search or preview failed');
   const help=await w.webContents.executeJavaScript(`(()=>{document.getElementById('help-tab').click();const visible=!document.getElementById('help-page').hidden;document.getElementById('skins-tab').click();return visible;})()`);
   if(!help)throw new Error('Instruction tab failed');
   const shortcutState=await w.webContents.executeJavaScript('window.studio.shortcut()');
   if(!shortcutState.lastShortcut||!await core.exists(shortcutState.lastShortcut))throw new Error('Shortcut button failed');
   await w.webContents.executeJavaScript('window.studio.launch()');
   if(launches!==1||focuses!==1)throw new Error('Launch must raise already running ChatGPT');
   if(process.argv.includes('--screenshot')){await w.webContents.executeJavaScript('Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))');await fs.writeFile(path.join(root,'docs/theme-selector-crossplatform.png'),(await w.webContents.capturePage()).toPNG());}
   app.exit(0);return;
  }await new Promise(r=>setTimeout(r,100));}
  throw new Error('Gallery smoke test failed: '+count);
 }
 const icon=nativeImage.createFromPath(path.join(root,'assets/studio-logo.png')).resize({width:22,height:22});
 tray=new Tray(icon);tray.setToolTip('ZLHRS Theme Studio');tray.setContextMenu(Menu.buildFromTemplate([{label:'Выбрать тему',click:show},{label:'Открыть ChatGPT',click:()=>apply(settings.theme,true).catch(report)},{type:'separator'},{label:'Выйти',click:()=>app.quit()}]));tray.on('click',show);
 if(app.isPackaged&&settings.shortcutFor!==process.execPath){try{await shortcut();settings.shortcutFor=process.execPath;await core.saveSettings(settingsFile,settings);}catch(error){report(error);}}
 if(launchOnly){try{await apply(settings.theme,true);}catch(e){report(e);show();}}else show();
}
async function apply(id,openWindow=false){
 if(!catalog.some(t=>t.id===id))throw new Error('Неизвестная тема.');
 if(busy)throw new Error('Дождитесь завершения текущего переключения.');
 busy=true;
 try{
  settings.theme=id;await core.saveSettings(settingsFile,settings);
  if(process.platform==='win32'&&!smoke){
   const legacy=path.join(process.env.LOCALAPPDATA,'ZLHRS/ThemeStudio/.selected-theme.json');
   if(await core.exists(legacy))await core.saveSettings(legacy,{theme:id});
  }
  cached=await core.payload(root,id);notify();
  let list=[];try{list=await core.targets();}catch{}
  if(!await core.exists(settings.appPath)){settings.appPath=await core.discover();await core.saveSettings(settingsFile,settings);}
  if(!list.length||openWindow){await core.launch(settings.appPath);}
  if(!list.length){for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,500));try{list=await core.targets();if(list.length)break;}catch{}}}
  if(!list.length)throw new Error('Тема сохранена. Полностью закройте ChatGPT и откройте его кнопкой здесь. Если не помогает, выбранная сборка приложения несовместима.');
  await tick();clearInterval(timer);timer=setInterval(()=>tick().catch(report),2500);
  if(openWindow){const target=list.find(t=>t.url.startsWith('app://-/index.html'))||list[0];await core.foreground(target);}
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
 const exe=process.env.APPIMAGE||process.execPath;
 const desktop=app.getPath('desktop');
 await fs.mkdir(desktop,{recursive:true});
 const launchArgs=app.isPackaged?['--launch']:[root,'--launch'];
 if(process.platform==='win32'){
  const file=path.join(desktop,'ChatGPT с темой.lnk');
  const args=launchArgs.map(a=>'"'+a+'"').join(' ');
  const ok=shell.writeShortcutLink(file,'create',{target:exe,args,cwd:path.dirname(exe),description:'ChatGPT с последней темой ZLHRS',icon:exe,iconIndex:0});if(!ok)throw new Error('Windows не разрешила запись на рабочий стол.');
  const saved=shell.readShortcutLink(file);if(saved.target.toLowerCase()!==exe.toLowerCase()||saved.args!==args)throw new Error('Windows сохранила неверный ярлык.');return file;
 }else if(process.platform==='linux'){
  const icon=path.join(app.getPath('userData'),'studio.png');await fs.copyFile(path.join(root,'assets/studio-logo.png'),icon);
  const quoted='"'+exe.replace(/[\\"`$]/g,'\\$&').replaceAll('%','%%')+'"';
  const argumentsText=launchArgs.map(a=>'"'+a.replace(/[\\"`$]/g,'\\$&').replaceAll('%','%%')+'"').join(' ');
  const entry='[Desktop Entry]\nType=Application\nName=ChatGPT с темой\nExec='+quoted+' '+argumentsText+'\nIcon='+icon+'\nTerminal=false\nCategories=Utility;\n';
  await fs.mkdir(desktop,{recursive:true});await fs.writeFile(path.join(desktop,'ChatGPT-with-theme.desktop'),entry,{mode:0o755});
  const applications=smoke?path.join(app.getPath('userData'),'applications'):path.join(process.env.XDG_DATA_HOME||path.join(app.getPath('home'),'.local/share'),'applications');await fs.mkdir(applications,{recursive:true});await fs.writeFile(path.join(applications,'zlhrs-chatgpt.desktop'),entry,{mode:0o755});return path.join(desktop,'ChatGPT-with-theme.desktop');
 }else{
  const bundle=path.join(desktop,'ChatGPT с темой.app','Contents');await fs.mkdir(path.join(bundle,'MacOS'),{recursive:true});
  await fs.writeFile(path.join(bundle,'Info.plist'),'<?xml version="1.0"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>CFBundleExecutable</key><string>launch</string><key>CFBundleIdentifier</key><string>com.zlhrs.chatgpt-launcher</string><key>CFBundleName</key><string>ChatGPT с темой</string><key>CFBundlePackageType</key><string>APPL</string></dict></plist>');
  await fs.writeFile(path.join(bundle,'MacOS/launch'),'#!/bin/sh\nexec '+shQuote(exe)+' '+launchArgs.map(shQuote).join(' ')+'\n',{mode:0o755});return path.dirname(bundle);
 }
}
async function updateApp(){
 if(updating)return;
 if(!app.isPackaged)throw new Error('В режиме исходников используйте git pull и npm ci. Автообновление доступно в установленном приложении.');
 updating=true;status='Проверяем новые выпуски…';notify();
 const info=await updates.check(app.getVersion(),process.platform,process.arch,!!process.env.APPIMAGE,fetch,portable);
 if(!info){updating=false;status='У вас последняя версия '+app.getVersion()+'. Перезапуск не нужен.';notify();return;}
 const directory=path.join(app.getPath('userData'),'updates',info.version);
 const installer=await updates.download(info,directory,percent=>{status='Обновление '+info.version+': загружено '+percent+'%';notify();});
 const result=path.join(app.getPath('userData'),'update-result.txt');
 let command,args;
 if(process.platform==='win32'){
  const helper=path.join(directory,'update.ps1');await fs.copyFile(path.join(__dirname,'update-windows.ps1'),helper);
  command=path.join(process.env.SystemRoot,'System32/WindowsPowerShell/v1.0/powershell.exe');
  args=['-NoProfile','-NonInteractive','-WindowStyle','Hidden','-ExecutionPolicy','Bypass','-File',helper,'-Installer',installer,'-Target',process.execPath,'-StudioPid',String(process.pid),'-ResultFile',result];
  if(portable)args.push('-Portable');
 }else{
  let target,kind;
  if(process.platform==='darwin'){
   target=process.execPath.slice(0,process.execPath.indexOf('.app/Contents/MacOS/')+4);kind='mac';
   if(path.basename(target)!=='ZLHRS Theme Studio.app')throw new Error('Перенесите Theme Studio в Applications и повторите обновление.');
  }else{kind=process.env.APPIMAGE?'appimage':'deb';target=process.env.APPIMAGE||process.execPath;}
  if(kind!=='deb')await fs.access(path.dirname(target),require('node:fs').constants.W_OK);
  else if(!await core.exists('/usr/bin/pkexec'))throw new Error('Для установки DEB требуется системный установщик. Скачанный файл: '+installer);
  const helper=path.join(directory,'update.sh');await fs.copyFile(path.join(__dirname,'update-unix.sh'),helper);
  command='/bin/sh';args=[helper,kind,installer,target,String(process.pid),result];
 }
 await core.saveSettings(settingsFile,settings);
 status='Обновление проверено. Устанавливаем и перезапускаем приложение…';notify();
 await new Promise((resolve,reject)=>{const child=spawn(command,args,{detached:true,stdio:'ignore',windowsHide:true});child.once('error',reject);child.once('spawn',()=>{child.unref();resolve();});});
 app.quit();
}
