param([string]$Installer,[string]$Target,[int]$StudioPid,[string]$ResultFile,[switch]$Portable)
$ErrorActionPreference='Stop'
try {
 for($i=0;$i -lt 60 -and (Get-Process -Id $StudioPid -ErrorAction SilentlyContinue);$i++){Start-Sleep -Milliseconds 500}
 if(Get-Process -Id $StudioPid -ErrorAction SilentlyContinue){throw 'Theme Studio не завершилось. Обновление отменено.'}
 if($Portable){
  if([IO.Path]::GetFileName($Target) -ne 'ZLHRS Theme Studio.exe'){throw 'Неверная папка приложения'}
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $stage=Join-Path (Split-Path -Parent $Installer) ('unpacked-'+[Guid]::NewGuid().ToString('N'))
  $stageFull=[IO.Path]::GetFullPath($stage)+[IO.Path]::DirectorySeparatorChar
  $zip=[IO.Compression.ZipFile]::OpenRead($Installer)
  try{foreach($entry in $zip.Entries){
   $entryPath=[IO.Path]::GetFullPath((Join-Path $stage $entry.FullName))
   if(-not $entryPath.StartsWith($stageFull,[StringComparison]::OrdinalIgnoreCase)){throw 'Небезопасный путь в архиве'}
  }}finally{$zip.Dispose()}
  [IO.Compression.ZipFile]::ExtractToDirectory($Installer,$stage)
  $source=Join-Path $stage 'ZLHRS Theme Studio'
  if(-not(Test-Path -LiteralPath (Join-Path $source 'PORTABLE')) -or -not(Test-Path -LiteralPath (Join-Path $source 'resources/app.asar'))){throw 'Неполный архив обновления'}
  $destination=[IO.Path]::GetFullPath((Split-Path -Parent $Target))
  $backup=Join-Path $stage 'backup';$replaced=@()
  try{foreach($file in Get-ChildItem -LiteralPath $source -Recurse -File){
   $relative=$file.FullName.Substring($source.Length).TrimStart('\')
   $to=[IO.Path]::GetFullPath((Join-Path $destination $relative))
   if(-not $to.StartsWith($destination+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'Неверный путь назначения'}
   if(Test-Path -LiteralPath $to){
    $saved=Join-Path $backup $relative;New-Item -ItemType Directory -Force (Split-Path -Parent $saved)|Out-Null
    Copy-Item -LiteralPath $to -Destination $saved -Force;$replaced+=@{From=$saved;To=$to}
   }
   New-Item -ItemType Directory -Force (Split-Path -Parent $to)|Out-Null
   Copy-Item -LiteralPath $file.FullName -Destination $to -Force
  }}catch{foreach($item in $replaced){Copy-Item -LiteralPath $item.From -Destination $item.To -Force};throw}
 }else{
  $process=Start-Process -FilePath $Installer -ArgumentList ('/S /D='+(Split-Path -Parent $Target)) -PassThru -Wait -WindowStyle Hidden
  if($process.ExitCode -ne 0){throw "Установщик завершился с кодом $($process.ExitCode)"}
 }
 [IO.File]::WriteAllText($ResultFile,'Обновление установлено. Последняя тема сохранена.',[Text.UTF8Encoding]::new($false))
} catch {
 [IO.File]::WriteAllText($ResultFile,('Не удалось обновить: '+$_.Exception.Message),[Text.UTF8Encoding]::new($false))
}
if(Test-Path -LiteralPath $Target){Start-Process -FilePath $Target -WindowStyle Hidden}
