param([string]$Destination = (Join-Path $env:USERPROFILE 'CodexThemes/skins'))
$ErrorActionPreference = 'Stop'
$source = Join-Path $PSScriptRoot 'themes'
New-Item -ItemType Directory -Force -Path $Destination | Out-Null
foreach ($theme in Get-ChildItem -LiteralPath $source -Directory) {
    $target = Join-Path $Destination $theme.Name
    if (Test-Path -LiteralPath $target) {
        Write-Host "Already installed, skipped: $($theme.Name)"
        continue
    }
    Copy-Item -LiteralPath $theme.FullName -Destination $target -Recurse
    Write-Host "Installed: $($theme.Name)"
}
Write-Host "Themes folder: $Destination"
Write-Host 'Next: read docs/INSTALL-RU.md to select and start a theme.'
