param([string]$Destination = (Join-Path $env:USERPROFILE '.claude/themes-for-claude'))
$ErrorActionPreference = 'Stop'
$source = Join-Path $PSScriptRoot 'themes'
if (-not (Test-Path -LiteralPath $source)) { throw 'Extract the entire Claude Code archive before running this installer.' }
[void][IO.Directory]::CreateDirectory($Destination)
$files = @(Get-ChildItem -LiteralPath $source -File | Where-Object { $_.Name -match '^zlhrs-[a-z0-9-]+\.(json|css|js)$' })
if (-not $files.Count) { throw 'No Claude themes found.' }
$backup = Join-Path $Destination ('backup-zlhrs-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
foreach ($file in $files) {
    $target = Join-Path $Destination $file.Name
    if (Test-Path -LiteralPath $target) {
        [void][IO.Directory]::CreateDirectory($backup)
        Copy-Item -LiteralPath $target -Destination (Join-Path $backup $file.Name)
    }
    Copy-Item -LiteralPath $file.FullName -Destination $target
}
Write-Output "Installed $($files.Count) theme files in $Destination. Open /themes > Yours in a Claude Desktop Code session."
