const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {spawn}=require('node:child_process');
async function startLegacyGuard({legacyRoot=path.join(process.env.LOCALAPPDATA||os.tmpdir(),'ZLHRS','ThemeStudio'),ownerPid=process.pid,mutexName='Local\\ZLHRSThemeWorker'}={}){
 if(process.platform!=='win32')return null;
 try{await fs.access(path.join(legacyRoot,'launcher','Theme-Engine.ps1'));}catch{return null;}
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'zlhrs-legacy-guard-'));
 const helper=path.join(dir,'legacy-guard.ps1');
 await fs.copyFile(path.join(__dirname,'legacy-guard.ps1'),helper);
 const child=spawn('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',helper,'-LegacyRoot',legacyRoot,'-StudioPid',String(ownerPid),'-MutexName',mutexName],{windowsHide:true,stdio:['ignore','pipe','pipe']});
 const stopped=new Promise(resolve=>child.once('close',async()=>{await fs.rm(dir,{recursive:true,force:true}).catch(()=>{});resolve();}));
 try{await new Promise((resolve,reject)=>{
  let output='',errors='';const timer=setTimeout(()=>done(new Error('Legacy theme guard timed out.')),15000);
  const done=error=>{clearTimeout(timer);child.removeListener('error',failed);child.removeListener('exit',exited);error?reject(error):resolve();};
  const failed=error=>done(error);const exited=()=>done(new Error(errors||'Legacy theme guard exited before readiness.'));
  child.once('error',failed);child.once('exit',exited);
  child.stderr.on('data',data=>{errors+=data.toString();});
  child.stdout.on('data',data=>{output+=data.toString();if(output.includes('ready'))done();});
 });}catch(error){child.kill();await stopped;throw new Error('Не удалось остановить старый механизм тем: '+error.message);}
 return {stop:async()=>{child.kill();await stopped;}};
}
module.exports={startLegacyGuard};
