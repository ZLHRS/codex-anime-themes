param([Parameter(Mandatory=$true)][string]$LegacyRoot,[Parameter(Mandatory=$true)][int]$StudioPid,[string]$MutexName='Local\ZLHRSThemeWorker')
$ErrorActionPreference='Stop'
$owner=Get-Process -Id $StudioPid -ErrorAction Stop
$expected=[IO.Path]::GetFullPath((Join-Path $LegacyRoot 'launcher/Theme-Engine.ps1'))
$filePattern='(?i)(?:^|\s)-File\s+(?:"'+[regex]::Escape($expected)+'"|'+[regex]::Escape($expected)+')(?=\s|$)'
$workers=@(Get-CimInstance Win32_Process | Where-Object {
 $_.Name -in @('powershell.exe','pwsh.exe') -and $_.CommandLine -match $filePattern -and $_.CommandLine -match '(?i)(?:^|\s)-Worker(?:\s|$)'
})
foreach($worker in $workers){
 $current=Get-CimInstance Win32_Process -Filter ('ProcessId = '+$worker.ProcessId)
 if($current -and $current.CreationDate -eq $worker.CreationDate -and $current.CommandLine -eq $worker.CommandLine){
  Stop-Process -Id $worker.ProcessId -Force -ErrorAction Stop
 }
}
$mutex=[Threading.Mutex]::new($false,$MutexName)
$acquired=$false
try{
 try{$acquired=$mutex.WaitOne(5000)}catch [Threading.AbandonedMutexException]{$acquired=$true}
 if(-not $acquired){throw 'Another theme controller still owns the legacy worker lock.'}
 [Console]::Out.WriteLine('ready');[Console]::Out.Flush()
 # Retain the old worker's lock until this exact Studio process exits.
 $owner.WaitForExit()
}finally{if($acquired){$mutex.ReleaseMutex()};$mutex.Dispose();$owner.Dispose()}
