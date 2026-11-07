param([switch]$Worker, [switch]$Validate)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
$config = Join-Path $root '.selected-theme.json'
function Get-Payload([string]$id) {
 if ($id -notmatch '^[a-z0-9][a-z0-9-]{0,63}$') { throw 'Invalid theme ID' }
 $folder = Join-Path $root "themes/$id"
 $theme = Get-Content -LiteralPath (Join-Path $folder 'theme.json') -Raw -Encoding UTF8 | ConvertFrom-Json
 $vars = ''
 foreach ($a in $theme.assets.PSObject.Properties) {
  $file = [IO.Path]::GetFullPath((Join-Path $folder $a.Value))
  if (-not $file.StartsWith([IO.Path]::GetFullPath($folder)+[IO.Path]::DirectorySeparatorChar)) { throw 'Invalid asset path' }
  $ext = [IO.Path]::GetExtension($file).ToLower()
  $mime = @{'.webp'='image/webp';'.png'='image/png';'.jpg'='image/jpeg';'.svg'='image/svg+xml'}[$ext]
  if (-not $mime) { throw 'Unsupported image' }
  $vars += '--cts-asset-'+$a.Name+':url("data:'+$mime+';base64,'+[Convert]::ToBase64String([IO.File]::ReadAllBytes($file))+'");'
 }
 $css = ':root.codex-theme-studio{'+$vars+'}'+[IO.File]::ReadAllText((Join-Path $folder $theme.css))
 $helpers = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'composer-overflow.mjs')).Replace('export function ','function ')
 $helpers = '(()=>{'+$helpers+';return {clearComposerSurfaceCompat,createComposerOverflowAnnotator,reconcileComposerSurfaces,selectComposerSurfaces};})()'
 $sha = [Security.Cryptography.SHA256]::Create()
 try { $stamp = 'pack:'+ $id + ':' + ([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($css))).Replace('-','').Substring(0,16)) } finally { $sha.Dispose() }
 $map = @{
 '__CTS_COMPOSER_OVERFLOW_HELPERS__'=$helpers
 '__CTS_CSS_JSON__'= (ConvertTo-Json -InputObject $css -Compress)
 '__CTS_THEME_JSON__'=($theme | ConvertTo-Json -Depth 30 -Compress)
 '__CTS_CHROME_JSON__'='null'; '__CTS_MOTION_JSON__'='{}'
 '__CTS_VERSION_JSON__'='"standalone-1.1.0"'
 '__CTS_STAMP_JSON__'=(ConvertTo-Json -InputObject $stamp -Compress)
 }
 $template=[IO.File]::ReadAllText((Join-Path $PSScriptRoot 'theme-runtime.js'))
 $payload=[regex]::Replace($template,'__CTS_[A-Z_]+__',{param($m) $map[$m.Value]})
 return @{ Expression=$payload; Stamp=$stamp }
}
function Invoke-ThemeCDP([string]$url,[string]$expression) {
 $uri=[Uri]$url
 if ($uri.Host -notin @('127.0.0.1','localhost') -or $uri.Port -ne 9345) { throw 'Unexpected debugging endpoint' }
 $ws=[Net.WebSockets.ClientWebSocket]::new();$cts=[Threading.CancellationTokenSource]::new(12000)
 try {
  [void]$ws.ConnectAsync($uri,$cts.Token).GetAwaiter().GetResult()
  $request=@{id=1;method='Runtime.evaluate';params=@{expression=$expression;returnByValue=$true}} | ConvertTo-Json -Depth 10 -Compress
  $bytes=[Text.Encoding]::UTF8.GetBytes($request)
  [void]$ws.SendAsync([ArraySegment[byte]]::new($bytes),[Net.WebSockets.WebSocketMessageType]::Text,$true,$cts.Token).GetAwaiter().GetResult()
  do {
   $ms=[IO.MemoryStream]::new();$buffer=New-Object byte[] 65536
   try {
    do { $r=$ws.ReceiveAsync([ArraySegment[byte]]::new($buffer),$cts.Token).GetAwaiter().GetResult();if($r.MessageType -eq 'Close'){throw 'Connection closed'};$ms.Write($buffer,0,$r.Count) } while(-not $r.EndOfMessage)
    $reply=[Text.Encoding]::UTF8.GetString($ms.ToArray()) | ConvertFrom-Json
   } finally { $ms.Dispose() }
  } while ($reply.id -ne 1)
  if ($reply.error -or $reply.result.exceptionDetails) { throw 'Theme application failed' }
  return $reply.result.result.value
 } finally { $ws.Dispose();$cts.Dispose() }
}
if ($Validate) {
 $items=Get-Content (Join-Path $root 'catalog.json') -Raw -Encoding UTF8 | ConvertFrom-Json
 foreach ($t in $items) {
  $p=Get-Payload $t.id
  if ($p.Expression -match '__CTS_[A-Z_]+__') { throw "Unresolved template: $($t.id)" }
  Write-Output "$($t.id): OK ($($p.Expression.Length) characters)"
 }
 return
}
if (-not $Worker) { return }
$mutex=[Threading.Mutex]::new($false,'Local\ZLHRSThemeWorker')
if (-not $mutex.WaitOne(0)) { $mutex.Dispose(); return }
try {
 $missing=0;$cachedId='';$payload=$null
 while ($missing -lt 30) {
  try {
   $targets=Invoke-RestMethod 'http://127.0.0.1:9345/json/list' -TimeoutSec 2
   $missing=0
   if (Test-Path -LiteralPath $config) {
    $id=(Get-Content $config -Raw -Encoding UTF8 | ConvertFrom-Json).theme
    if ($cachedId -ne $id) { $payload=Get-Payload $id;$cachedId=$id }
    foreach ($target in $targets) {
     if ($target.type -ne 'page' -or $target.url -notmatch '^app://-/(index|detached-window)\.html' -or $target.url -match 'avatar-overlay') { continue }
     $state=Invoke-ThemeCDP $target.webSocketDebuggerUrl '({stamp:window.__CODEX_THEME_STUDIO__?.stamp,ready:!!document.body})'
     if ($state.ready -and $state.stamp -ne $payload.Stamp) { $null=Invoke-ThemeCDP $target.webSocketDebuggerUrl $payload.Expression }
    }
   }
  } catch { $missing++; $_.Exception.Message | Set-Content (Join-Path $root '.theme-error.log') -Encoding UTF8 }
  Start-Sleep -Seconds 2
 }
} finally { $mutex.ReleaseMutex();$mutex.Dispose() }
