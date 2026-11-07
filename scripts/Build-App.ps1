$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot
$compiler=Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
if(-not(Test-Path $compiler)){$compiler=Join-Path $env:WINDIR 'Microsoft.NET/Framework/v4.0.30319/csc.exe'}
& $compiler /nologo /target:winexe /platform:anycpu /optimize+ /reference:System.Windows.Forms.dll ('/win32icon:'+(Join-Path $root 'assets/studio.ico')) ('/out:'+(Join-Path $root 'ZLHRS Theme Studio.exe')) (Join-Path $root 'app/Program.cs')
if($LASTEXITCODE -ne 0){throw 'Application build failed'}
Write-Output 'Built ZLHRS Theme Studio.exe'
