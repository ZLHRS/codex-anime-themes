param([string]$BuildFolder,[string]$OutputFolder)
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot
$version=(Get-Content -LiteralPath (Join-Path $root 'package.json') -Raw|ConvertFrom-Json).version
$folder=if($BuildFolder){[IO.Path]::GetFullPath($BuildFolder)}else{Join-Path $root 'dist/win-unpacked'}
$destination=if($OutputFolder){[IO.Path]::GetFullPath($OutputFolder)}else{Join-Path $root 'dist'}
[void][IO.Directory]::CreateDirectory($destination)
if(-not(Test-Path -LiteralPath (Join-Path $folder 'ZLHRS Theme Studio.exe'))){throw 'Build the Windows application first'}
[IO.File]::WriteAllText((Join-Path $folder 'PORTABLE'),'ZLHRS Theme Studio portable',[Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $folder 'START-HERE.txt'),"Extract the entire folder and open ZLHRS Theme Studio.exe. No installation is required.`r`nKeep the EXE and all companion files together.`r`nAll themes are included. ChatGPT or Claude Desktop is required separately. For Claude, install Claude Desktop Themes once; see the README.`r`nChange language under Settings > Interface language: English or Russian.`r`nUse Check for updates in Settings to download a published update.`r`n",[Text.UTF8Encoding]::new($false))
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive=Join-Path $destination ('ZLHRS-Theme-Studio-'+$version+'-win-x64-portable.zip')
if(Test-Path -LiteralPath $archive){Remove-Item -LiteralPath $archive}
$zip=[IO.Compression.ZipFile]::Open($archive,'Create')
try{foreach($file in Get-ChildItem -LiteralPath $folder -Recurse -File){
 $relative=$file.FullName.Substring($folder.Length).TrimStart('\').Replace('\','/')
 # Never publish machine-specific sources or personal artwork with the app.
 if($file.Name -eq 'theme-source.json' -or $relative -match '^(themes|previews|personal-themes|updates)/'){continue}
 [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$file.FullName,('ZLHRS Theme Studio/'+$relative),'Optimal')
}}finally{$zip.Dispose()}
Write-Output $archive
