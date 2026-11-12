// Render the existing preview fixture with the project's bundled Electron.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs');
const Module=require('node:module');
const originalLoad=Module._load;
Module._load=function(name,...args){
 if(name!=='playwright')return originalLoad.call(this,name,...args);
 return {chromium:{launch:async()=>{
  await app.whenReady();
  return {
   newPage:async({viewport})=>{
    const win=new BrowserWindow({show:false,width:viewport.width,height:viewport.height,useContentSize:true,webPreferences:{offscreen:true,backgroundThrottling:false}});
    return {
     setContent:async html=>{
      await win.loadURL('about:blank');
      await win.webContents.executeJavaScript('document.open();document.write('+JSON.stringify(html)+');document.close();');
     },
     evaluate:fn=>win.webContents.executeJavaScript('('+fn.toString()+')()'),
     screenshot:async({path,quality})=>{
      await win.webContents.executeJavaScript('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
      fs.writeFileSync(path,(await win.webContents.capturePage()).toJPEG(quality));
     }
    };
   },
   close:async()=>app.quit()
  };
 }}};
};
require('./render-previews.cjs');
