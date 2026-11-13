// Real renderer, isolated settings, no connection to the user's ChatGPT.
const {app,BrowserWindow,ipcMain}=require('electron');const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'studio-language-'));app.setPath('userData',dir);
app.whenReady().then(async()=>{
 const themes=await require('../desktop/local-themes.cjs').readCatalog(root),pets=await require('../desktop/pets.cjs').read(root);
 const state={language:'ru',themes,pets,petCount:pets.length,selected:themes[0].id,status:'Выберите тему — она сохранится для следующих запусков.',platform:process.platform,version:'test',appearance:{brightness:100,size:100,x:0,y:0,animations:true,effects:true},effect:'Мягкое бирюзовое сияние'};
 ipcMain.handle('studio:state',()=>state);ipcMain.handle('studio:language',(_e,value)=>{state.language=value;fs.writeFileSync(path.join(dir,'settings.json'),JSON.stringify(state));return state;});
 const w=new BrowserWindow({show:false,width:1180,height:850,webPreferences:{preload:path.join(root,'desktop/preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 const run=s=>w.webContents.executeJavaScript(s,true);
 const ready=async()=>{for(let n=0;n<100;n++){if(await run('document.querySelectorAll(".card").length')===themes.length)return;await new Promise(r=>setTimeout(r,30));}throw Error('Renderer did not load');};
 await w.loadFile(path.join(root,'desktop/index.html'));await ready();
 await run(`document.getElementById('settings-tab').click();document.getElementById('brightness').value='123';document.getElementById('brightness').dispatchEvent(new Event('input'));document.getElementById('language').value='en';document.getElementById('language').onchange()`);
 assert.equal(await run('document.documentElement.lang'),'en');assert.equal(await run('document.getElementById("brightness").value'),'123');assert.equal(await run('document.getElementById("settings-page").hidden'),false);assert.equal(await run('document.getElementById("appearance-dirty").textContent'),'You have unsaved changes');assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'settings.json'))).language,'en');
 for(const page of ['skins','collections','pets','settings','help']){
  await run(`document.getElementById('${page}-tab').click()`);
  const leftovers=await run(`(()=>{const result=[];const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);while(walk.nextNode()){const n=walk.currentNode;if(n.parentElement?.tagName!=='OPTION'&&n.parentElement?.tagName!=='SCRIPT'&&/[А-Яа-яЁё]/.test(n.nodeValue))result.push(n.nodeValue.trim());}return result;})()`);assert.deepEqual(leftovers,[],page+' untranslated text');
 }
 await run(`document.getElementById('character-filter').click()`);assert.equal(await run(`document.querySelector('.character-option span').textContent`),'Ai Hoshino');await run(`document.getElementById('close-characters').click();document.getElementById('search').value='Warm Evening';document.getElementById('search').dispatchEvent(new Event('input'))`);assert.equal(await run('document.querySelectorAll(".card").length'),1);
 w.setContentSize(850,680);await run(`document.getElementById('settings-tab').click()`);assert.equal(await run('document.documentElement.scrollWidth>innerWidth'),false);
 fs.mkdirSync(path.join(root,'output'),{recursive:true});await w.webContents.capturePage(undefined,{stayHidden:true,stayAwake:true});await new Promise(r=>setTimeout(r,300));fs.writeFileSync(path.join(root,'output/settings-english.png'),(await w.webContents.capturePage(undefined,{stayHidden:true,stayAwake:true})).toPNG());
 await w.loadFile(path.join(root,'desktop/index.html'));await ready();assert.equal(await run('document.documentElement.lang'),'en');
 await run(`document.getElementById('language').value='ru';document.getElementById('language').onchange()`);assert.equal(await run('document.documentElement.lang'),'ru');assert.equal(await run('document.querySelector(".card h2").textContent'),themes[0].name);assert.equal(await run('document.getElementById("brightness").value'),'100');assert.equal(state.selected,themes[0].id);
 console.log('Language UI passed: English coverage, live switching, unsaved settings, search, compact layout, reload and Russian restoration.');app.exit(0);
}).catch(e=>{console.error(e);app.exit(1)});
