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
      // Offscreen Chromium can return a uniform frame before its first paint.
      // Never replace a usable gallery preview with that blank frame.
      for(let attempt=0;attempt<20;attempt++){
       win.webContents.invalidate();
       await new Promise(resolve=>setTimeout(resolve,150));
       const frame=await win.webContents.capturePage();
       const pixels=frame.toBitmap();
       let varied=false;
       for(let i=4;i<pixels.length;i+=4){
        if(pixels[i]!==pixels[0]||pixels[i+1]!==pixels[1]||pixels[i+2]!==pixels[2]){varied=true;break;}
       }
       if(varied){fs.writeFileSync(path,frame.toJPEG(quality));return;}
      }
      throw new Error('Preview stayed blank: '+path);
     }
    };
   },
   close:async()=>app.quit()
  };
 }}};
};
require('./render-previews.cjs');
