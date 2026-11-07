$ErrorActionPreference='Stop'
try {
 & (Join-Path $PSScriptRoot 'Install-Studio.ps1') | Out-Null
 $installed=Join-Path $env:LOCALAPPDATA 'ZLHRS/ThemeStudio/Theme-Selector.ps1'
 & $installed
} catch {
 Add-Type -AssemblyName PresentationFramework
 [void][Windows.MessageBox]::Show($_.Exception.Message,'ZLHRS Theme Studio — запуск')
 exit 1
}
