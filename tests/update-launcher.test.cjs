const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {launchWindowsUpdate}=require('../desktop/update-launcher.cjs');
test('Windows update helper starts independently and preserves quoted Unicode paths',{skip:process.platform!=='win32',timeout:40000},async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'zlhrs-update-launch-'));
 try{const helper=path.join(dir,'helper with spaces.ps1'),out=path.join(dir,'result.json');
 await fs.writeFile(helper,'\ufeffparam([string]$Value,[string]$OutFile,[string]$ReadyFile)\n[IO.File]::WriteAllText($OutFile,$Value,[Text.UTF8Encoding]::new($false))\n[IO.File]::WriteAllText($ReadyFile,"ready")\n');
 const value='Кана "quoted" C:\\theme folder\\';
 await launchWindowsUpdate(path.join(process.env.SystemRoot,'System32/WindowsPowerShell/v1.0/powershell.exe'),['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',helper,'-Value',value,'-OutFile',out],dir);
 assert.equal(await fs.readFile(out,'utf8'),value);
 }finally{await fs.rm(dir,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});

