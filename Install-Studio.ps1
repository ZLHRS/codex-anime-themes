param([string]$Destination=(Join-Path $env:LOCALAPPDATA 'ZLHRS/ThemeStudio'))
$ErrorActionPreference='Stop'
$source=[IO.Path]::GetFullPath($PSScriptRoot)
$dest=[IO.Path]::GetFullPath($Destination)
if($source -ne $dest){
 New-Item -ItemType Directory -Force $dest | Out-Null
 foreach($dir in @('themes','previews','launcher','docs')){Copy-Item -LiteralPath (Join-Path $source $dir) -Destination $dest -Recurse -Force}
 foreach($f in @('Theme-Selector.ps1','Install-Studio.ps1','START.cmd','catalog.json','VERSION')){Copy-Item -LiteralPath (Join-Path $source $f) -Destination (Join-Path $dest $f) -Force}
 if(-not(Test-Path (Join-Path $dest '.selected-theme.json')) -and (Test-Path (Join-Path $source '.selected-theme.json'))){Copy-Item -LiteralPath (Join-Path $source '.selected-theme.json') -Destination $dest}
}
$shell=New-Object -ComObject WScript.Shell
$icon="$env:SystemRoot\System32\shell32.dll,14"
$pkg=Get-AppxPackage -Name OpenAI.Codex | Select-Object -First 1
if($pkg){$exe=Join-Path $pkg.InstallLocation 'app/ChatGPT.exe';if(Test-Path $exe){$icon=$exe+',0'}}
foreach($folder in @($shell.SpecialFolders.Item('Desktop'),$shell.SpecialFolders.Item('Programs'))){
 foreach($name in @('ChatGPT','ZLHRS Theme Studio')){
  $path=Join-Path $folder ($name+'.lnk')
  if((Test-Path -LiteralPath $path) -and -not(Test-Path -LiteralPath ($path+'.before-theme-studio.bak'))){Copy-Item -LiteralPath $path -Destination ($path+'.before-theme-studio.bak')}
  $link=$shell.CreateShortcut($path);$link.TargetPath="$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
  $link.Arguments='-NoProfile -STA -WindowStyle Hidden -ExecutionPolicy Bypass -File "'+(Join-Path $dest 'Theme-Selector.ps1')+'"'
  if($name -eq 'ChatGPT'){$link.Arguments+=' -Launch'}
  $link.WorkingDirectory=$dest;$link.IconLocation=$icon;$link.Description='ChatGPT с последней выбранной темой — ZLHRS Theme Studio';$link.Save()
 }
}
Write-Output "Installed: $dest"
