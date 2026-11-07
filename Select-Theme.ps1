param([string]$ThemeId = 'tatsumaki-jade-duo')
$ErrorActionPreference = 'Stop'
if ($ThemeId -notmatch '^[a-z0-9][a-z0-9-]{0,63}$') { throw 'Invalid theme ID' }
$store = Join-Path $env:USERPROFILE 'CodexThemes/skins'
if (-not (Test-Path -LiteralPath (Join-Path $store "$ThemeId/theme.json"))) { throw 'Install themes first with Install-Themes.ps1' }
$settingsPath = Join-Path $env:APPDATA 'wangnov/codexappmanager/data/settings.json'
New-Item -ItemType Directory -Force (Split-Path $settingsPath) | Out-Null
if (Test-Path -LiteralPath $settingsPath) {
    Copy-Item -LiteralPath $settingsPath -Destination ($settingsPath + '.themes-backup-' + (Get-Date -Format yyyyMMdd-HHmmss))
    $settings = Get-Content -LiteralPath $settingsPath -Raw | ConvertFrom-Json
} else { $settings = [pscustomobject]@{} }
$settings | Add-Member -NotePropertyName codexTheme -NotePropertyValue $ThemeId -Force
$settings | Add-Member -NotePropertyName codexThemeStoreDir -NotePropertyValue $store -Force
[IO.File]::WriteAllText($settingsPath, ($settings | ConvertTo-Json -Depth 30), [Text.UTF8Encoding]::new($false))
Write-Host "Selected: $ThemeId. Close the theme manager and restart via launcher/Open-ThemedChat.ps1."
