$ErrorActionPreference = 'Stop'
$nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
$bundled = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
if ($nodeCommand) { $nodePath = $nodeCommand.Source }
elseif (Test-Path -LiteralPath $bundled) { $nodePath = $bundled }
else { throw 'Install Node.js 22 or newer from nodejs.org, then try again.' }
if (Get-Process -Name ChatGPT -ErrorAction SilentlyContinue) { throw 'Close ChatGPT/Codex completely before starting this launcher.' }
$package = Get-AppxPackage -Name OpenAI.Codex | Select-Object -First 1
if (-not $package) { throw 'OpenAI.Codex Windows package was not found.' }
$appPath = Join-Path $package.InstallLocation 'app/ChatGPT.exe'
if (-not (Test-Path -LiteralPath $appPath)) { throw 'ChatGPT.exe was not found in the installed package.' }
Start-Process -FilePath $appPath -ArgumentList '--remote-debugging-address=127.0.0.1','--remote-debugging-port=9345'
Start-Process -FilePath $nodePath -ArgumentList ('"' + (Join-Path $PSScriptRoot 'start-theme.mjs') + '"') -WindowStyle Hidden
