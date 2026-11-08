const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {spawn,execFile}=require('node:child_process');
const run=require('node:util').promisify(execFile);
async function startLegacyGuard({legacyRoot=path.join(process.env.LOCALAPPDATA||os.tmpdir(),'ZLHRS','ThemeStudio'),ownerPid=process.pid,mutexName='Local\\ZLHRSThemeWorker'}={}){
 if(process.platform!=='win32')return null;
 try{await fs.access(path.join(legacyRoot,'launcher','Theme-Engine.ps1'));}catch{return null;}
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'zlhrs-legacy-guard-'));
 const helper=path.join(dir,'legacy-guard.ps1');
 await fs.copyFile(path.join(__dirname,'legacy-guard.ps1'),helper);
 const args=['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',helper,'-LegacyRoot',legacyRoot,'-StudioPid',String(ownerPid),'-MutexName',mutexName];
 let executable='powershell.exe',childArgs=args;
 // Compile into our private temporary folder; retain the old guard as a
 // compatibility fallback on Windows installations without .NET Framework.
 const lockExe=path.join(dir,'legacy-lock.exe');
 try{
  const source=path.join(dir,'legacy-lock.cs');
  await fs.copyFile(path.join(__dirname,'legacy-lock.cs'),source);
  const compiler=path.join(process.env.WINDIR||'C:\\Windows','Microsoft.NET','Framework64','v4.0.30319','csc.exe');
  await run(compiler,['/nologo','/target:exe','/optimize+','/out:'+lockExe,source],{windowsHide:true,timeout:15000});
  executable=lockExe;childArgs=[String(ownerPid),mutexName];
 }catch{}
 if(executable===lockExe){
  try{await run('powershell.exe',[...args,'-StopOnly'],{windowsHide:true,timeout:15000});}
  catch(error){await fs.rm(dir,{recursive:true,force:true}).catch(()=>{});throw error;}
 }
 const child=spawn(executable,childArgs,{windowsHide:true,stdio:['ignore','pipe','pipe']});
 const stopped=new Promise(resolve=>child.once('close',async()=>{await fs.rm(dir,{recursive:true,force:true}).catch(()=>{});resolve();}));
 try{await new Promise((resolve,reject)=>{
  let output='',errors='';const timer=setTimeout(()=>done(new Error('Legacy theme guard timed out.')),15000);
  const done=error=>{clearTimeout(timer);child.removeListener('error',failed);child.removeListener('exit',exited);error?reject(error):resolve();};
  const failed=error=>done(error);const exited=()=>done(new Error(errors||'Legacy theme guard exited before readiness.'));
  child.once('error',failed);child.once('exit',exited);
  child.stderr.on('data',data=>{errors+=data.toString();});
  child.stdout.on('data',data=>{output+=data.toString();if(output.includes('ready'))done();});
 });}catch(error){child.kill();await stopped;throw new Error('Не удалось остановить старый механизм тем: '+error.message);}
 return {kind:executable===lockExe?'native':'powershell',pid:child.pid,stop:async()=>{child.kill();await stopped;}};
}
module.exports={startLegacyGuard};
