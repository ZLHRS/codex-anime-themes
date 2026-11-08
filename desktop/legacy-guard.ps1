param([Parameter(Mandatory=$true)][string]$LegacyRoot,[Parameter(Mandatory=$true)][int]$StudioPid,[string]$MutexName='Local\ZLHRSThemeWorker',[switch]$StopOnly)
$ErrorActionPreference='Stop'
$owner=Get-Process -Id $StudioPid -ErrorAction Stop
$expected=(Resolve-Path -LiteralPath (Join-Path $LegacyRoot 'launcher/Theme-Engine.ps1')).ProviderPath
$workers=@(Get-CimInstance Win32_Process | Where-Object {
 if($_.Name -notin @('powershell.exe','pwsh.exe') -or $_.CommandLine -notmatch '(?i)(?:^|\s)-Worker(?:\s|$)'){return $false}
 if($_.CommandLine -notmatch '(?i)(?:^|\s)-File\s+(?:"([^"]+)"|(\S+))'){return $false}
 $scriptPath=if($Matches[1]){$Matches[1]}else{$Matches[2]}
 try{$resolved=(Resolve-Path -LiteralPath $scriptPath -ErrorAction Stop).ProviderPath}catch{return $false}
 return [string]::Equals($resolved,$expected,[StringComparison]::OrdinalIgnoreCase)
})
foreach($worker in $workers){
 $current=Get-CimInstance Win32_Process -Filter ('ProcessId = '+$worker.ProcessId)
 if($current -and $current.CreationDate -eq $worker.CreationDate -and $current.CommandLine -eq $worker.CommandLine){
  Stop-Process -Id $worker.ProcessId -Force -ErrorAction Stop
 }
}
if($StopOnly){$owner.Dispose();exit 0}
$mutex=[Threading.Mutex]::new($false,$MutexName)
$acquired=$false
try{
 try{$acquired=$mutex.WaitOne(5000)}catch [Threading.AbandonedMutexException]{$acquired=$true}
 if(-not $acquired){throw 'Another theme controller still owns the legacy worker lock.'}
 [Console]::Out.WriteLine('ready');[Console]::Out.Flush()
 # Retain the old worker's lock until this exact Studio process exits.
 $owner.WaitForExit()
}finally{if($acquired){$mutex.ReleaseMutex()};$mutex.Dispose();$owner.Dispose()}
