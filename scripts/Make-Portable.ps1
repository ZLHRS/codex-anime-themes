$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot
$version=(Get-Content -LiteralPath (Join-Path $root 'package.json') -Raw|ConvertFrom-Json).version
$folder=Join-Path $root 'dist/win-unpacked'
if(-not(Test-Path -LiteralPath (Join-Path $folder 'ZLHRS Theme Studio.exe'))){throw 'Build the Windows application first'}
[IO.File]::WriteAllText((Join-Path $folder 'PORTABLE'),'ZLHRS Theme Studio portable',[Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $folder 'START-HERE.txt'),"Распакуйте всю папку и откройте ZLHRS Theme Studio.exe. Установка не нужна.`r`nНе переносите EXE отдельно от остальных файлов.`r`nВсе темы включены. ChatGPT должен быть установлен отдельно.`r`nКнопка «Подтянуть изменения» обновляет файлы в этой папке без установщика.`r`n",[Text.UTF8Encoding]::new($true))
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive=Join-Path $root ('dist/ZLHRS-Theme-Studio-'+$version+'-win-x64-portable.zip')
if(Test-Path -LiteralPath $archive){Remove-Item -LiteralPath $archive}
$zip=[IO.Compression.ZipFile]::Open($archive,'Create')
try{foreach($file in Get-ChildItem -LiteralPath $folder -Recurse -File){
 $relative=$file.FullName.Substring($folder.Length).TrimStart('\').Replace('\','/')
 [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$file.FullName,('ZLHRS Theme Studio/'+$relative),'Optimal')
}}finally{$zip.Dispose()}
Write-Output $archive
