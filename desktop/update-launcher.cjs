const fs=require('node:fs/promises');
const path=require('node:path');
const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const run=promisify(execFile);
function quoteArgument(value){return '"'+String(value).replace(/(\\*)"/g,'$1$1\\"').replace(/(\\+)$/,'$1$1')+'"';}
async function launchWindowsUpdate(command,args,directory){
 const ready=path.join(directory,'helper-ready.txt');
 const payload=path.join(directory,'helper-launch.json');
 await fs.unlink(ready).catch(()=>{});
 const line=[command,...args,'-ReadyFile',ready].map(quoteArgument).join(' ');
 await fs.writeFile(payload,JSON.stringify({commandLine:line,cwd:directory}),'utf8');
 // WMI starts the helper outside Electron's process job. Waiting for readiness
 // prevents closing Studio when PowerShell cannot start or is blocked.
 const script=`$ErrorActionPreference='Stop';$p=Get-Content -LiteralPath '${payload.replaceAll("'","''")}' -Raw -Encoding UTF8|ConvertFrom-Json;$startup=New-CimInstance -ClassName Win32_ProcessStartup -ClientOnly -Property @{ShowWindow=[uint16]0};$r=Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{CommandLine=$p.commandLine;CurrentDirectory=$p.cwd;ProcessStartupInformation=$startup};if($r.ReturnValue -ne 0){throw ('Cannot start update helper: '+$r.ReturnValue)}`;
 await run(command,['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{windowsHide:true,timeout:20000});
 for(let i=0;i<100;i++){if(await fs.readFile(ready,'utf8').then(s=>s.trim()==='ready',()=>false))return;await new Promise(r=>setTimeout(r,150));}
 throw new Error('Помощник обновления не запустился. Studio остаётся открытой; попробуйте ещё раз.');
}
module.exports={quoteArgument,launchWindowsUpdate};
