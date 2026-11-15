const {app,BrowserWindow,ipcMain}=require('electron');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),appearance=require('../desktop/appearance.cjs');
app.whenReady().then(async()=>{
 const themes=await require('../desktop/local-themes.cjs').readCatalog(root);
 const state={themes,selected:'ascii-moonlit',language:'en',appearance:appearance.normalize(),pets:[],petCount:0,platform:'win32',status:'',version:'test'};
 ipcMain.handle('studio:state',()=>state);
 ipcMain.handle('studio:appearance',(_e,id,value)=>{assert.equal(id,state.selected);state.appearance=appearance.normalize(value);return state});
 const w=new BrowserWindow({show:false,width:1180,height:900,webPreferences:{preload:path.join(root,'desktop/preload.cjs'),sandbox:true}});
 const run=s=>w.webContents.executeJavaScript(s,true);
 await w.loadFile(path.join(root,'desktop/index.html'));
 for(let n=0;n<80;n++){if(await run(`document.querySelectorAll('.card').length`)===97)break;await new Promise(r=>setTimeout(r,50));}
 await run(`document.getElementById('settings-tab').click()`);
 assert.equal(await run(`document.getElementById('ascii-controls').hidden`),false);
 assert.equal(await run(`document.getElementById('ascii-speed').value`),'4');
 assert.equal(await run(`document.getElementById('ascii-motion').selectedOptions[0].textContent`),'Cell by cell');
 await run(`document.getElementById('ascii-speed').value='2';document.getElementById('ascii-speed').dispatchEvent(new Event('input'));document.getElementById('ascii-motion').value='smooth';document.getElementById('ascii-cell').value='18';document.getElementById('ascii-veil').value='0.65';document.getElementById('save-appearance').click()`);
 await new Promise(r=>setTimeout(r,150));
 assert.deepEqual(state.appearance.ascii,{motion:'smooth',speed:2,cell:18,veil:.65});
 await w.loadFile(path.join(root,'desktop/index.html'));await new Promise(r=>setTimeout(r,250));
 await run(`document.getElementById('settings-tab').click()`);
 assert.equal(await run(`document.getElementById('ascii-speed').value`),'2');
 assert.equal(await run(`document.documentElement.scrollWidth>innerWidth`),false);
 fs.writeFileSync(path.join(root,'output/ascii-settings.png'),(await w.webContents.capturePage()).toPNG());
 console.log('ASCII settings: original defaults, English labels, saved values and reload passed.');app.exit(0);
}).catch(e=>{console.error(e);app.exit(1)});
