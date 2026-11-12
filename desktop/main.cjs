const {app,BrowserWindow,ipcMain,dialog,shell,clipboard} = require('electron');
const fs=require('node:fs/promises');
const path=require('node:path');
const localThemes=require('./local-themes.cjs');
const core=require('./core.cjs');
const updates=require('./updates.cjs');
const appearance=require('./appearance.cjs');
const pets=require('./pets.cjs');
const {ThemeSession}=require('./theme-session.cjs');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const themeSession=new ThemeSession(root);
let legacyGuard;
let themeRoot=root;
let window,settings={},settingsFile,catalog=[],timer,busy=false,cached,status='Выберите тему — она сохранится для следующих запусков.',quitting=false,lastShortcut='',updating=false;
const smoke=process.argv.includes('--smoke-test');
if(smoke){const temp=path.join(app.getPath('temp'),'zlhrs-smoke-'+process.pid);app.setPath('userData',temp);require('node:fs').mkdirSync(path.join(temp,'Desktop'),{recursive:true});app.setPath('desktop',path.join(temp,'Desktop'));}
const launchOnly=process.argv.includes('--launch');
const portable=process.platform==='win32'&&require('node:fs').existsSync(path.join(path.dirname(process.execPath),'PORTABLE'));
const ownsLock=smoke || app.requestSingleInstanceLock();
let startup;
let startupLaunched=false;
let petCatalog=[];
if(!ownsLock||process.argv.includes('--quit-for-update'))app.quit();
else {
app.on('second-instance',(_event,args)=>{if(args.includes('--quit-for-update')){app.quit();return;}if(args.includes('--launch'))Promise.resolve(startup).then(()=>{if(!busy)return apply(settings.theme,true);}).catch(report);else Promise.resolve(startup).then(show).catch(report);});
app.on('before-quit',()=>{quitting=true;clearInterval(timer);legacyGuard?.stop();});
app.on('window-all-closed',()=>{});
app.on('activate',()=>{if(!launchOnly)show();});
startup=app.whenReady().then(init).catch(error=>{if(smoke){console.error(error);app.exit(1);}else{dialog.showErrorBox('ZLHRS Theme Studio',error.message);app.quit();}});
}
function report(error){status=error.message;notify();}
function snapshot(){return {themes:catalog,selected:settings.theme,appPath:settings.appPath||'',status,platform:process.platform,version:app.getVersion(),lastShortcut,updating,petCount:petCatalog.length,pets:petCatalog.map(({id,name})=>({id,name})),appearance:appearance.normalize(settings.appearance?.[settings.theme]),effect:appearance.designs[settings.theme]?.[0]||''};}
function notify(){if(window&&!window.isDestroyed())window.webContents.send('studio:state',snapshot());}
function show(){if(window&&!window.isDestroyed()){window.show();window.focus();}else createWindow();}
function createWindow(){
 window=new BrowserWindow({width:1180,height:850,minWidth:850,minHeight:620,title:'ZLHRS Theme Studio',backgroundColor:'#0e1017',icon:path.join(root,'assets/studio.ico'),show:false,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 window.setMenuBarVisibility(false);
 window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 window.webContents.on('will-navigate',event=>event.preventDefault());
 // The theme session lives in the main process without a tray icon. Release the gallery
 // renderer and decoded previews when closed; recreate them on demand.
 const createdWindow=window;
 window.on('closed',()=>{if(window===createdWindow)window=null;});
 window.once('ready-to-show',()=>window.show());
 window.loadFile(path.join(__dirname,'index.html'));
 return window;
}
async function readCatalog(){return localThemes.readCatalog(themeRoot);}
async function refreshThemes(){
 if(busy||updating)throw new Error('Дождитесь завершения текущего действия.');
 busy=true;
 try{
  const next=await readCatalog();
  const selected=next.some(t=>t.id===settings.theme)?settings.theme:next[0].id;
  const nextSettings={...settings,theme:selected};
  const nextPayload=await core.payload(root,selected,settings.appearance?.[selected],themeRoot);
  await core.saveSettings(settingsFile,nextSettings);
  catalog=next;settings=nextSettings;
  if(cached){cached={id:selected,...nextPayload};themeSession.current=cached;}
  status='Список обновлён: '+catalog.length+' тем.'+(themeRoot!==root?' Темы загружены из локального проекта.':'');
  notify();return snapshot();
 }finally{busy=false;}
}
async function init(){
 petCatalog=await pets.read(root);
 const guardStartup=smoke?Promise.resolve():require('./legacy-guard.cjs').startLegacyGuard().then(value=>{legacyGuard=value;});
 guardStartup.catch(()=>{});
 themeRoot=await localThemes.resolveSource(path.join(app.isPackaged?process.resourcesPath:root,'theme-source.json'),root,path.join(app.getPath('userData'),'theme-source.json'));
 themeSession.themeRoot=themeRoot;
 settingsFile=path.join(app.getPath('userData'),'settings.json');
 const updateResult=path.join(app.getPath('userData'),'update-result.txt');
 try{status=await fs.readFile(updateResult,'utf8');await fs.unlink(updateResult);}catch{}
 try{settings=await core.readJson(settingsFile);}catch{}
 if(Number.isInteger(settings.debugPort)&&settings.debugPort>=9345&&settings.debugPort<=9445)core.setDebugPort(settings.debugPort);
 const earlyLaunch=launchOnly&&!smoke?(async()=>{
  if(!await core.exists(settings.appPath))return false;
  try{await core.targets();return false;}catch{}
  await core.closeRunning(settings.appPath);
  settings.debugPort=await core.freeDebugPort();core.setDebugPort(settings.debugPort);await core.saveSettings(settingsFile,settings);
  await core.launch(settings.appPath);return true;
 })():Promise.resolve(false);
 earlyLaunch.catch(()=>{});
 if(!settings.theme&&process.platform==='win32')try{settings.theme=(await core.readJson(path.join(process.env.LOCALAPPDATA,'ZLHRS/ThemeStudio/.selected-theme.json'))).theme;}catch{}
 catalog=await readCatalog();
 if(!catalog.some(t=>t.id===settings.theme))settings.theme=catalog[0].id;
 if(!await core.exists(settings.appPath))settings.appPath=await core.discover();
 const {session}=require('electron');session.defaultSession.setPermissionRequestHandler((_wc,_p,callback)=>callback(false));
 ipcMain.handle('studio:state',()=>snapshot());
 ipcMain.handle('studio:apply',async(_e,id)=>{try{await apply(id);return snapshot();}catch(e){report(e);return snapshot();}});
 ipcMain.handle('studio:appearance',async(_e,id,value)=>{
  if(busy||updating)throw new Error('Дождитесь завершения текущего действия.');
  if(id!==settings.theme||!catalog.some(t=>t.id===id))throw new Error('Сначала выберите эту тему.');
  busy=true;
  try{
   settings.appearance={...settings.appearance,[id]:appearance.normalize(value)};
   await core.saveSettings(settingsFile,settings);
   cached=await themeSession.select(id,settings.appearance[id]);
   try{await themeSession.reconcile();status='Настройки темы сохранены и применены.';}catch{status='Настройки сохранены. Они применятся при следующем запуске ChatGPT через Studio.';}
   notify();return snapshot();
  }finally{busy=false;}
 });
 ipcMain.handle('studio:launch',async()=>{try{await apply(settings.theme,true);return snapshot();}catch(e){report(e);return snapshot();}});
 ipcMain.handle('studio:choose',async()=>{
  const result=await dialog.showOpenDialog(window,{title:'Выберите приложение ChatGPT / Codex',properties:['openFile'],filters:process.platform==='win32'?[{name:'Приложение',extensions:['exe']}]:undefined});
  if(!result.canceled){settings.appPath=result.filePaths[0];await core.saveSettings(settingsFile,settings);status='Приложение выбрано. Можно применить тему.';notify();}return snapshot();
 });
 ipcMain.handle('studio:shortcut',async()=>{try{await shortcut('studio');lastShortcut=await shortcut();status='Ярлыки Studio и ChatGPT с темой обновлены. Старые ссылки заменены.';}catch(e){status='Не удалось создать ярлык: '+e.message;}notify();return snapshot();});
 ipcMain.handle('studio:reveal',()=>{if(lastShortcut)shell.showItemInFolder(lastShortcut);});
 ipcMain.handle('studio:update',async()=>{try{await updateApp();}catch(e){updating=false;report(e);}return snapshot();});
 ipcMain.handle('studio:refresh',refreshThemes);
 ipcMain.handle('studio:import-pets',async()=>{
  if(busy||updating)throw new Error('Дождитесь завершения текущего действия.');
  clipboard.writeText(pets.importPrompt(petCatalog));
  try{await apply(settings.theme,true);status='Запрос на добавление '+petCatalog.length+' питомцев скопирован. Вставьте его в новый чат ChatGPT и отправьте. Уже добавленные питомцы будут пропущены.';}
  catch(error){status='Запрос скопирован. Откройте ChatGPT, вставьте и отправьте его. '+error.message;}
  notify();return snapshot();
 });
 ipcMain.handle('studio:quit',()=>app.quit());
 if(smoke){
  let launches=0,focuses=0;
  core.launch=async()=>{launches++;};core.foreground=async()=>{focuses++;};core.targets=async()=>[{type:'page',url:'app://-/index.html',webSocketDebuggerUrl:'ws://127.0.0.1:9345/test'}];core.evaluate=async()=>({stamp:cached?.stamp,theme:cached?.id,ready:focuses>0,styled:true,disabled:false});
  const w=createWindow();await new Promise(resolve=>w.webContents.once('did-finish-load',resolve));
  const count=await w.webContents.executeJavaScript('document.querySelectorAll(".card").length');
  // Renderer fetches the catalog asynchronously.
  for(let i=0;i<30;i++){if(await w.webContents.executeJavaScript('document.querySelectorAll(".card").length')===catalog.length){
   const found=await w.webContents.executeJavaScript(`(()=>{const s=document.getElementById('search');s.value='tatsumaki';s.dispatchEvent(new Event('input'));const count=document.querySelectorAll('.card').length;s.value='';s.dispatchEvent(new Event('input'));document.querySelector('.preview-button').click();const modal=document.getElementById('preview').open;document.getElementById('close-preview').click();return {count,modal};})()`);
   if(found.count!==2||!found.modal)throw new Error('Search or preview failed');
   const help=await w.webContents.executeJavaScript(`(()=>{document.getElementById('help-tab').click();const visible=!document.getElementById('help-page').hidden;document.getElementById('skins-tab').click();return visible;})()`);
   if(!help)throw new Error('Instruction tab failed');
   const shortcutState=await w.webContents.executeJavaScript('window.studio.shortcut()');
   if(!shortcutState.lastShortcut||!await core.exists(shortcutState.lastShortcut))throw new Error('Shortcut button failed');
   const studioShortcut=await shortcut('studio');
   if(!await core.exists(studioShortcut))throw new Error('Studio shortcut missing');
   if(process.platform==='win32'){shell.writeShortcutLink(studioShortcut,'update',{target:path.join(app.getPath('temp'),'old-studio.exe')});}
   if(await shortcut('studio')!==studioShortcut)throw new Error('Shortcut location changed');
   if(process.platform==='win32'){
    if(shell.readShortcutLink(studioShortcut).target!==process.execPath)throw new Error('Stale Studio shortcut not repaired');
    const startLink=path.join(app.getPath('userData'),'test-start-menu','ZLHRS Theme Studio.lnk');
    shell.writeShortcutLink(startLink,'update',{target:path.join(app.getPath('temp'),'old-studio.exe')});
    await w.webContents.executeJavaScript('window.studio.shortcut()');
    if(shell.readShortcutLink(startLink).target!==process.execPath||shell.readShortcutLink(startLink).args.includes('--launch'))throw new Error('Start menu Studio shortcut not repaired');
   }
   await w.webContents.executeJavaScript('window.studio.launch()');
   if(launches!==1||focuses!==1)throw new Error('Launch must raise already running ChatGPT');
   await w.webContents.executeJavaScript("(async()=>{const before=await window.studio.state();document.getElementById('search').value='no-match';await document.getElementById('refresh').onclick();const after=await window.studio.state();if(after.selected!==before.selected||document.querySelectorAll('.card').length!==after.themes.length)throw Error('Catalog refresh failed');})()");
   const original=settings.theme;
   const check=updates.check;updates.check=async()=>null;
   await w.webContents.executeJavaScript("(async()=>{document.getElementById('search').value='no-match';document.getElementById('active').click();await document.getElementById('update').onclick();const s=await window.studio.state();if(document.querySelectorAll('.card').length!==s.themes.length||!s.status.includes('Список обновлён'))throw Error('Update did not refresh themes');})()");
   updates.check=async()=>{throw Error('Offline test');};
   await w.webContents.executeJavaScript("(async()=>{await document.getElementById('update').onclick();const s=await window.studio.state();if(!s.status.includes('Список обновлён')||s.updating)throw Error('Offline update lost theme refresh');})()");
   updates.check=check;
   await w.webContents.executeJavaScript(`(async()=>{const slider=document.getElementById('brightness');slider.value='137';slider.dispatchEvent(new Event('input'));document.getElementById('animations').checked=false;await document.getElementById('save-appearance').onclick();if((await window.studio.state()).appearance.brightness!==137)throw Error('Appearance controls failed');})()`);
   if(settings.appearance[original].brightness!==137||settings.appearance[original].animations!==false)throw new Error('Appearance settings were not saved');
   const other=catalog.find(t=>t.id!==original).id;await apply(other);if(snapshot().appearance.brightness!==100)throw new Error('Settings leaked between themes');await apply(original);if(snapshot().appearance.brightness!==137)throw new Error('Theme settings were lost');
   if((await core.readJson(settingsFile)).appearance[original].brightness!==137)throw new Error('Appearance settings missing on disk');

   if(process.argv.includes('--screenshot')){await w.webContents.executeJavaScript('Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))');await fs.writeFile(path.join(root,'docs/theme-selector-crossplatform.png'),(await w.webContents.capturePage()).toPNG());}
   await new Promise(resolve=>{w.once('closed',resolve);w.close();});
   if(!w.isDestroyed()||window!==null)throw new Error('Closed gallery was retained');
   await themeSession.reconcile();
   await apply(settings.theme,true);
   if(window!==null)throw new Error('Themed chat launcher opened the gallery');
   const foreground=core.foreground;core.foreground=async()=>{throw new Error('Window not ready yet');};
   try{await apply(settings.theme,true);if(!timer)throw new Error('Theme recovery timer missing');}finally{core.foreground=foreground;}
   for(const shortcutPath of [shortcutState.lastShortcut,studioShortcut]){
    if(path.dirname(path.resolve(shortcutPath))!==path.resolve(app.getPath('desktop')))throw new Error('Test shortcut escaped temporary desktop');
    await fs.rm(shortcutPath,{recursive:true});
   }
   const reopened=createWindow();await new Promise(resolve=>reopened.webContents.once('did-finish-load',resolve));
   const restored=await reopened.webContents.executeJavaScript('window.studio.state()');
   if(await core.exists(shortcutState.lastShortcut)||await core.exists(studioShortcut))throw new Error('Deleted shortcuts were recreated');
   if(restored.selected!==original||restored.appearance.brightness!==137)throw new Error('Gallery reopen lost settings');
   const writeClipboard=clipboard.writeText;let importText='';
   clipboard.writeText=text=>{importText=text;};
   try{
    await reopened.webContents.executeJavaScript("document.getElementById('import-pets').onclick()");
    if(!importText.includes('https://chatgpt.com/s/sharepet_')||!status.includes('скопирован'))throw new Error('Pet import request was not prepared');
    if(settings.theme!==original)throw new Error('Pet import changed theme selection');
   }finally{clipboard.writeText=writeClipboard;}
   app.exit(0);return;
  }await new Promise(r=>setTimeout(r,100));}
  throw new Error('Gallery smoke test failed: '+count);
 }
 await guardStartup;startupLaunched=await earlyLaunch;
 // Desktop shortcuts are created only by the explicit button (or installer).
 // Launching from Start must respect shortcuts the user has deleted.
 if(launchOnly){try{await apply(settings.theme,true);}catch(e){report(e);}}else show();
}
async function apply(id,openWindow=false){
 if(!catalog.some(t=>t.id===id))throw new Error('Неизвестная тема.');
 if(busy)throw new Error('Дождитесь завершения текущего переключения.');
 busy=true;
 try{
  settings.theme=id;await core.saveSettings(settingsFile,settings);
  cached=await themeSession.select(id,settings.appearance?.[id]);clearInterval(timer);timer=setInterval(()=>{if(!busy)tick().catch(report);},2500);status="Тема сохранена. Подключаемся к ChatGPT…";notify();
  const alreadyLaunched=startupLaunched;startupLaunched=false;
  let list=[],reachable=false;try{list=await core.targets();reachable=true;}catch{}
  if(!await core.exists(settings.appPath)){settings.appPath=await core.discover();await core.saveSettings(settingsFile,settings);}
  if(!reachable&&!alreadyLaunched){
   status='Подготавливаем подключение. Если ChatGPT уже открыт, он будет перезапущен…';notify();
   try{await core.closeRunning(settings.appPath);}catch(error){await core.launch(settings.appPath);throw error;}
   settings.debugPort=await core.freeDebugPort();core.setDebugPort(settings.debugPort);await core.saveSettings(settingsFile,settings);
  }
  if(!alreadyLaunched&&(!list.length||openWindow)){await core.launch(settings.appPath);}
  await require('./launch-recovery.cjs').awaitThemedLaunch({session:themeSession,file:settings.appPath,openWindow,restart:async()=>{
   status='Предыдущий процесс ChatGPT завершает работу. Повторяем запуск…';notify();
   await core.closeRunning(settings.appPath);
   settings.debugPort=await core.freeDebugPort();core.setDebugPort(settings.debugPort);await core.saveSettings(settingsFile,settings);
   await core.launch(settings.appPath);
  }});
  status='Тема проверена в окне ChatGPT. Следующий запуск — через ярлык «ChatGPT с темой».';
  notify();
 }finally{busy=false;}
}
let ticking=false;
async function tick(){
 if(ticking)return;
 ticking=true;
 try{return await themeSession.reconcile();}finally{ticking=false;}
}
function shQuote(value){return "'"+value.replaceAll("'","'\\''")+"'";}
async function shortcut(kind='chat'){
 const studio=kind==='studio';
 const name=studio?'ZLHRS Theme Studio':'ChatGPT с темой';
 const exe=process.env.APPIMAGE||process.execPath;
 const desktop=app.getPath('desktop');
 await fs.mkdir(desktop,{recursive:true});
 const launchArgs=[...(app.isPackaged?[]:[root]),...(studio?[]:['--launch'])];
 if(process.platform==='win32'){
  const programs=smoke?path.join(app.getPath('userData'),'test-start-menu'):path.join(app.getPath('appData'),'Microsoft','Windows','Start Menu','Programs');
  const args=launchArgs.map(a=>'"'+a+'"').join(' ');
  for(const directory of [desktop,programs]){
   await fs.mkdir(directory,{recursive:true});
   const file=path.join(directory,name+'.lnk');
   const details={target:exe,args,cwd:path.dirname(exe),description:studio?'Выбор и настройка тем ZLHRS':'ChatGPT с последней темой ZLHRS',icon:exe,iconIndex:0};
   const ok=shell.writeShortcutLink(file,await core.exists(file)?'update':'create',details);
   if(!ok)throw new Error('Windows не разрешила обновление ярлыка.');
   const saved=shell.readShortcutLink(file);
   if(saved.target.toLowerCase()!==exe.toLowerCase()||saved.args!==args)throw new Error('Windows сохранила неверный ярлык.');
  }
  return path.join(desktop,name+'.lnk');
 }else if(process.platform==='linux'){
  const icon=path.join(app.getPath('userData'),'studio.png');await fs.copyFile(path.join(root,'assets/studio-logo.png'),icon);
  const quoted='"'+exe.replace(/[\\"`$]/g,'\\$&').replaceAll('%','%%')+'"';
  const argumentsText=launchArgs.map(a=>'"'+a.replace(/[\\"`$]/g,'\\$&').replaceAll('%','%%')+'"').join(' ');
  const entry='[Desktop Entry]\nType=Application\nName='+name+'\nExec='+quoted+' '+argumentsText+'\nIcon='+icon+'\nTerminal=false\nCategories=Utility;\n';
  await fs.mkdir(desktop,{recursive:true});await fs.writeFile(path.join(desktop,studio?'ZLHRS-Theme-Studio.desktop':'ChatGPT-with-theme.desktop'),entry,{mode:0o755});
  const applications=smoke?path.join(app.getPath('userData'),'applications'):path.join(process.env.XDG_DATA_HOME||path.join(app.getPath('home'),'.local/share'),'applications');await fs.mkdir(applications,{recursive:true});await fs.writeFile(path.join(applications,studio?'zlhrs-theme-studio.desktop':'zlhrs-chatgpt.desktop'),entry,{mode:0o755});return path.join(desktop,studio?'ZLHRS-Theme-Studio.desktop':'ChatGPT-with-theme.desktop');
 }else{
  const bundle=path.join(desktop,name+'.app','Contents');await fs.mkdir(path.join(bundle,'MacOS'),{recursive:true});
  await fs.writeFile(path.join(bundle,'Info.plist'),'<?xml version="1.0"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>CFBundleExecutable</key><string>launch</string><key>CFBundleIdentifier</key><string>com.zlhrs.'+(studio?'studio-launcher':'chatgpt-launcher')+'</string><key>CFBundleName</key><string>'+name+'</string><key>CFBundlePackageType</key><string>APPL</string></dict></plist>');
  await fs.writeFile(path.join(bundle,'MacOS/launch'),'#!/bin/sh\nexec '+shQuote(exe)+' '+launchArgs.map(shQuote).join(' ')+'\n',{mode:0o755});return path.dirname(bundle);
 }
}
async function updateApp(){
 if(updating||busy)return;
 await refreshThemes();
 const refreshed=status;
 if(!app.isPackaged){status=refreshed+' Программа запущена из исходников; установка готового выпуска не требуется.';notify();return;}
 updating=true;status=refreshed+' Проверяем обновление программы…';notify();
 let info;
 try{info=await updates.check(app.getVersion(),process.platform,process.arch,!!process.env.APPIMAGE,fetch,portable);}
 catch(error){updating=false;status=refreshed+' Обновление программы не проверено: '+error.message;notify();return;}
 if(!info){updating=false;status=refreshed+' Версия программы '+app.getVersion()+' — последняя опубликованная.';notify();return;}
 const directory=path.join(app.getPath('userData'),'updates',info.version);
 const installer=await updates.download(info,directory,percent=>{status='Обновление '+info.version+': загружено '+percent+'%';notify();});
 const result=path.join(app.getPath('userData'),'update-result.txt');
 let command,args;
 if(process.platform==='win32'){
  const helper=path.join(directory,'update.ps1');await fs.writeFile(helper,'\ufeff'+(await fs.readFile(path.join(__dirname,'update-windows.ps1'),'utf8')).replace(/^\uFEFF/,''),'utf8');
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
 if(process.platform==='win32')await require('./update-launcher.cjs').launchWindowsUpdate(command,args,directory);
 else await new Promise((resolve,reject)=>{const child=spawn(command,args,{detached:true,stdio:'ignore',windowsHide:true});child.once('error',reject);child.once('spawn',()=>{child.unref();resolve();});});
 app.quit();
}
