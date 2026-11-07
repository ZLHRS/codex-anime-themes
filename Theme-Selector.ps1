param([switch]$SelfTest)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[Windows.Forms.Application]::EnableVisualStyles()
$root=$PSScriptRoot
$catalog=Get-Content (Join-Path $root 'catalog.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$config=Join-Path $root '.selected-theme.json'
$form=New-Object Windows.Forms.Form
$form.Text='ZLHRS — Темы для Codex / ChatGPT';$form.Size=New-Object Drawing.Size(920,620);$form.MinimumSize=$form.Size;$form.StartPosition='CenterScreen'
$form.BackColor=[Drawing.Color]::FromArgb(28,30,40);$form.ForeColor=[Drawing.Color]::White
$form.Font=New-Object Drawing.Font('Segoe UI',11)
$list=New-Object Windows.Forms.ListBox;$list.Location=New-Object Drawing.Point(20,55);$list.Size=New-Object Drawing.Size(330,440)
$list.BackColor=[Drawing.Color]::FromArgb(40,43,57);$list.ForeColor=[Drawing.Color]::White;$list.DisplayMember='name'
foreach($t in $catalog){[void]$list.Items.Add($t)}
$title=New-Object Windows.Forms.Label;$title.Text='Выберите тему';$title.Location=New-Object Drawing.Point(20,18);$title.AutoSize=$true
$picture=New-Object Windows.Forms.PictureBox;$picture.Location=New-Object Drawing.Point(375,55);$picture.Size=New-Object Drawing.Size(500,330);$picture.SizeMode='Zoom'
$note=New-Object Windows.Forms.Label;$note.Location=New-Object Drawing.Point(375,400);$note.Size=New-Object Drawing.Size(500,90);$note.Text='Превью показывает иллюстрацию и палитру. Выберите тему и нажмите «Применить / открыть». Отдельный менеджер и Node.js не нужны.'
$status=New-Object Windows.Forms.Label;$status.Location=New-Object Drawing.Point(20,548);$status.Size=New-Object Drawing.Size(855,38);$status.Text='Готово. Темы берутся прямо из папки этого набора.'
$apply=New-Object Windows.Forms.Button;$apply.Text='Применить / открыть';$apply.Location=New-Object Drawing.Point(375,500);$apply.Size=New-Object Drawing.Size(255,40)
$help=New-Object Windows.Forms.Button;$help.Text='Инструкция';$help.Location=New-Object Drawing.Point(650,500);$help.Size=New-Object Drawing.Size(225,40)
foreach($b in @($apply,$help)){$b.BackColor=[Drawing.Color]::FromArgb(75,86,120);$b.FlatStyle='Flat'}
$list.add_SelectedIndexChanged({
 if($picture.Image){$picture.Image.Dispose();$picture.Image=$null}
 $path=Join-Path $root ('previews/'+$list.SelectedItem.id+'.jpg')
 if(Test-Path $path){$picture.Image=[Drawing.Image]::FromFile($path)}
})
$help.add_Click({Start-Process (Join-Path $root 'docs/START-HERE.txt')})
$apply.add_Click({
 try {
  if(-not $list.SelectedItem){return}
  if(Get-Process -Name codex-app-manager -ErrorAction SilentlyContinue){throw 'Закройте Codex App Manager, чтобы он не возвращал старую тему. Затем нажмите кнопку снова.'}
  $reachable=$false
  try{$null=Invoke-RestMethod 'http://127.0.0.1:9345/json/list' -TimeoutSec 2;$reachable=$true}catch{}
  if(-not $reachable){
   if(Get-Process -Name ChatGPT -ErrorAction SilentlyContinue){throw 'Полностью закройте ChatGPT / Codex и нажмите кнопку снова. Уже открытое обычным ярлыком окно не поддерживает подключение темы.'}
   $package=Get-AppxPackage -Name OpenAI.Codex | Select-Object -First 1
   if(-not $package){throw 'Сначала установите настольный Codex / ChatGPT для Windows (пакет OpenAI.Codex).'}
   $appPath=Join-Path $package.InstallLocation 'app/ChatGPT.exe'
   if(-not(Test-Path $appPath)){throw 'Эта сборка приложения не поддерживается: не найден ChatGPT.exe.'}
  }
  [IO.File]::WriteAllText($config,(@{theme=$list.SelectedItem.id}|ConvertTo-Json),[Text.UTF8Encoding]::new($false))
  if(-not $reachable){Start-Process -FilePath $appPath -ArgumentList '--remote-debugging-address=127.0.0.1','--remote-debugging-port=9345'}
  $engine=Join-Path $root 'launcher/Theme-Engine.ps1'
  Start-Process powershell.exe -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -File "'+$engine+'" -Worker') -WindowStyle Hidden
  $status.Text='Выбрана: '+$list.SelectedItem.name+'. Применение занимает несколько секунд.'
 }catch{[void][Windows.Forms.MessageBox]::Show($_.Exception.Message,'Не удалось применить тему');$status.Text='Тема не применена — смотрите сообщение.'}
})
$form.Controls.AddRange(@($title,$list,$picture,$note,$apply,$help,$status))
$list.SelectedIndex=0
if(Test-Path $config){$selected=(Get-Content $config -Raw -Encoding UTF8|ConvertFrom-Json).theme;for($i=0;$i -lt $list.Items.Count;$i++){if($list.Items[$i].id -eq $selected){$list.SelectedIndex=$i;break}}}
if($SelfTest){if($list.Items.Count -ne 16 -or -not $picture.Image){throw 'UI validation failed'};$form.Show();[Windows.Forms.Application]::DoEvents();$bmp=New-Object Drawing.Bitmap($form.Width,$form.Height);$form.DrawToBitmap($bmp,(New-Object Drawing.Rectangle(0,0,$form.Width,$form.Height)));$bmp.Save((Join-Path $root 'docs/theme-selector.png'));$bmp.Dispose();$form.Hide();Write-Output 'Theme selector: 16 entries and preview loaded';$form.Dispose();return}
[void]$form.ShowDialog()
if($picture.Image){$picture.Image.Dispose()};$form.Dispose()
