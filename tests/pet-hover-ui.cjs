const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,webPreferences:{backgroundThrottling:false}});
 await w.loadURL('data:text/html,<div data-codex-pet-id="reze" data-codex-pet-state="idle" style="width:192px;height:208px;background-size:800% 900%"></div>');
 const source=fs.readFileSync(path.join(__dirname,'../runtime/pet-hover.mjs'),'utf8').replace('export function ','function ');
 const result=await w.webContents.executeJavaScript(`(async()=>{
 ${source}
 const clean=installPetHover(document,window),pet=document.querySelector('div');
 const tick=()=>new Promise(r=>setTimeout(r,30));
 const enter=()=>pet.dispatchEvent(new PointerEvent('pointerover',{bubbles:true}));
 const leave=()=>pet.dispatchEvent(new PointerEvent('pointerout',{bubbles:true}));
 const state=s=>pet.setAttribute('data-codex-pet-state',s);
 enter();state('jumping');await tick();
 const first=pet.getAnimations()[0];
 const frames=first.effect.getKeyframes();
 first.currentTime=150;
 const secondFrame=getComputedStyle(pet).backgroundPosition;
 leave();const stopped=pet.getAnimations().length===0;
 enter();await tick();const next=pet.getAnimations()[0].effect.getKeyframes()[0].backgroundPosition;
 state('running');await tick();const nativeWork=pet.getAnimations().length===0;
 leave();pet.style.backgroundSize='800% 1100%';state('jumping');enter();await tick();
 const v2=pet.getAnimations()[0].effect.getKeyframes()[0].backgroundPosition;
 clean();const cleaned=pet.getAnimations().length===0;
 enter();await tick();
 return {first:frames[0].backgroundPosition,next,secondFrame,stopped,nativeWork,v2,cleaned,afterCleanup:pet.getAnimations().length,frames:frames.length};
 })()`);
 assert.notEqual(result.first,result.next);
 assert.notEqual(result.first,result.secondFrame);
 assert.ok(result.stopped&&result.nativeWork&&result.cleaned);
 assert.equal(result.afterCleanup,0);
 assert.ok(result.frames>=9);
 assert.ok(!result.first.endsWith('50%')); // v1 jumping is row 4 of 9
 console.log('Pet hover browser checks passed',result);
 app.exit(0);
}).catch(e=>{console.error(e);app.exit(1)});
