param([string]$OutputFolder)
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot
$version=(Get-Content -LiteralPath (Join-Path $root 'package.json') -Raw|ConvertFrom-Json).version
$destination=if($OutputFolder){[IO.Path]::GetFullPath($OutputFolder)}else{Join-Path $root 'dist'}
[void][IO.Directory]::CreateDirectory($destination)
$archive=Join-Path $destination ('ZLHRS-Theme-Studio-'+$version+'-source.zip')
if(Test-Path -LiteralPath $archive){throw "Archive already exists: $archive"}
$files=@()
foreach($name in @('README.md','CHANGELOG.md','VERSION','package.json','package-lock.json','catalog.json','theme-inventory.json','.gitignore','.gitattributes','pets/catalog.json')){$files+=Get-Item -LiteralPath (Join-Path $root $name)}
foreach($name in @('.github','assets','desktop','docs','runtime','scripts','tests','themes')){$files+=Get-ChildItem -LiteralPath (Join-Path $root $name) -Recurse -File}
$files+=Get-ChildItem -LiteralPath (Join-Path $root 'previews') -Filter '*-chat.jpg' -File
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip=[IO.Compression.ZipFile]::Open($archive,'Create')
try{foreach($file in $files){$relative=$file.FullName.Substring($root.Length).TrimStart('\').Replace('\','/');[void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$file.FullName,('ZLHRS-Theme-Studio-'+$version+'/'+$relative),'Optimal')}}finally{$zip.Dispose()}
Write-Output $archive
