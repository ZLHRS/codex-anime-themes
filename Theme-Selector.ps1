param([switch]$Launch,[switch]$SelfTest)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[Windows.Forms.Application]::EnableVisualStyles()
$root=$PSScriptRoot
$catalog=Get-Content (Join-Path $root 'catalog.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$config=Join-Path $root '.selected-theme.json'
$script:selected=$catalog[0].id
if(Test-Path $config){try{$saved=(Get-Content $config -Raw -Encoding UTF8|ConvertFrom-Json).theme;if($catalog.id -contains $saved){$script:selected=$saved}}catch{}}
function Open-ThemedApp([string]$id){
 if(Get-Process -Name codex-app-manager -ErrorAction SilentlyContinue){throw 'Закройте Codex App Manager: он может возвращать старое оформление.'}
 $ready=$false;try{$null=Invoke-RestMethod 'http://127.0.0.1:9345/json/list' -TimeoutSec 2;$ready=$true}catch{}
 if(-not $ready){
  if(Get-Process -Name ChatGPT -ErrorAction SilentlyContinue){throw 'ChatGPT уже открыт обычным способом. Полностью закройте его и откройте новым ярлыком ChatGPT с рабочего стола.'}
  $package=Get-AppxPackage -Name OpenAI.Codex|Select-Object -First 1
  if(-not $package){throw 'Не найден установленный Codex / ChatGPT для Windows (OpenAI.Codex).'}
  $exe=Join-Path $package.InstallLocation 'app/ChatGPT.exe';if(-not(Test-Path $exe)){throw 'Эта сборка приложения пока не поддерживается.'}
 }
 $tmp=$config+'.tmp';[IO.File]::WriteAllText($tmp,(@{theme=$id}|ConvertTo-Json),[Text.UTF8Encoding]::new($false));Move-Item -LiteralPath $tmp -Destination $config -Force
 if(-not $ready){Start-Process $exe -ArgumentList '--remote-debugging-address=127.0.0.1','--remote-debugging-port=9345'}
 Start-Process powershell.exe -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -File "'+(Join-Path $root 'launcher/Theme-Engine.ps1')+'" -Worker') -WindowStyle Hidden
}
if($Launch){try{Open-ThemedApp $script:selected}catch{[void][Windows.Forms.MessageBox]::Show($_.Exception.Message,'ChatGPT — запуск с темой')};return}
$form=New-Object Windows.Forms.Form;$form.Text='ZLHRS Theme Studio';$form.Size=New-Object Drawing.Size(1120,800);$form.MinimumSize=New-Object Drawing.Size(1000,680);$form.StartPosition='CenterScreen';$form.BackColor=[Drawing.ColorTranslator]::FromHtml('#111521');$form.ForeColor=[Drawing.Color]::White;$form.Font=New-Object Drawing.Font('Segoe UI',10)
$header=New-Object Windows.Forms.Panel;$header.Dock='Top';$header.Height=155;$header.Width=$form.ClientSize.Width;$header.BackColor=[Drawing.ColorTranslator]::FromHtml('#1c2335')
$title=New-Object Windows.Forms.Label;$title.Text='THEME STUDIO';$title.Font=New-Object Drawing.Font('Segoe UI',23,[Drawing.FontStyle]::Bold);$title.Location=New-Object Drawing.Point(24,15);$title.AutoSize=$true
$subtitle=New-Object Windows.Forms.Label;$subtitle.Text='Твоя коллекция. Один клик — новое настроение.';$subtitle.Location=New-Object Drawing.Point(27,62);$subtitle.AutoSize=$true;$subtitle.ForeColor=[Drawing.Color]::LightSteelBlue
$search=New-Object Windows.Forms.TextBox;$search.Location=New-Object Drawing.Point(27,110);$search.Width=320;$search.BackColor=[Drawing.ColorTranslator]::FromHtml('#303a51');$search.ForeColor=[Drawing.Color]::White
$searchLabel=New-Object Windows.Forms.Label;$searchLabel.Text='Поиск по названию';$searchLabel.Location=New-Object Drawing.Point(360,114);$searchLabel.AutoSize=$true
$install=New-Object Windows.Forms.Button;$install.Text='Создать ярлык ChatGPT';$install.Size=New-Object Drawing.Size(240,38);$install.Location=New-Object Drawing.Point(805,25);$install.Anchor='Top,Right'
$open=New-Object Windows.Forms.Button;$open.Text='Открыть с последней темой';$open.Size=New-Object Drawing.Size(240,38);$open.Location=New-Object Drawing.Point(805,75);$open.Anchor='Top,Right'
$footer=New-Object Windows.Forms.Panel;$footer.Dock='Bottom';$footer.Height=55
$status=New-Object Windows.Forms.Label;$status.Dock='Fill';$status.Padding=New-Object Windows.Forms.Padding(25,15,5,0);$status.Text='Последняя тема: '+($catalog|Where-Object id -eq $script:selected).name
$footer.Controls.Add($status)
$grid=New-Object Windows.Forms.FlowLayoutPanel;$grid.Dock='Fill';$grid.AutoScroll=$true;$grid.Padding=New-Object Windows.Forms.Padding(18);$grid.BackColor=$form.BackColor
$script:cards=@();$script:buttons=@();$script:images=@()
function Apply-Selected([string]$id){try{Open-ThemedApp $id;$script:selected=$id;foreach($button in $script:buttons){$button.Text=if($button.Tag -eq $id){'Выбрана ✓'}else{'Применить тему'}};$status.Text='Сохранено: '+($catalog|Where-Object id -eq $id).name+' — будет включаться при запуске ChatGPT.'}catch{[void][Windows.Forms.MessageBox]::Show($_.Exception.Message,'Не удалось применить');$status.Text='Тема не применена. Смотрите сообщение.'}}
foreach($t in $catalog){
 $card=New-Object Windows.Forms.Panel;$card.Size=New-Object Drawing.Size(330,236);$card.Margin=New-Object Windows.Forms.Padding(8);$card.BackColor=[Drawing.ColorTranslator]::FromHtml('#20283b');$card.Tag=$t
 $pic=New-Object Windows.Forms.PictureBox;$pic.Location=New-Object Drawing.Point(0,0);$pic.Size=New-Object Drawing.Size(330,142);$pic.SizeMode='Zoom';$pic.Image=[Drawing.Image]::FromFile((Join-Path $root ('previews/'+$t.id+'.jpg')));$script:images+=$pic.Image
 $name=New-Object Windows.Forms.Label;$name.Text=$t.name;$name.Location=New-Object Drawing.Point(12,151);$name.Size=New-Object Drawing.Size(305,30);$name.AutoEllipsis=$true
 $btn=New-Object Windows.Forms.Button;$btn.Tag=$t.id;$btn.Text=if($t.id -eq $script:selected){'Выбрана ✓'}else{'Применить тему'};$btn.Location=New-Object Drawing.Point(12,187);$btn.Size=New-Object Drawing.Size(306,35);$btn.FlatStyle='Flat';$btn.BackColor=[Drawing.ColorTranslator]::FromHtml('#465780');$btn.ForeColor=[Drawing.Color]::White
 $btn.add_Click({param($sender,$e) Apply-Selected $sender.Tag})
 $card.Controls.AddRange(@($pic,$name,$btn));$grid.Controls.Add($card);$script:cards+=$card;$script:buttons+=$btn
}
$search.add_TextChanged({foreach($card in $script:cards){$card.Visible=($card.Tag.name+' '+$card.Tag.id).IndexOf($search.Text,[StringComparison]::OrdinalIgnoreCase) -ge 0}})
$open.add_Click({Apply-Selected $script:selected})
$install.add_Click({try{& (Join-Path $root 'Install-Studio.ps1');$status.Text='Готово: ярлыки ChatGPT и Theme Studio созданы на рабочем столе.'}catch{[void][Windows.Forms.MessageBox]::Show($_.Exception.Message,'Установка')}})
foreach($b in @($open,$install)){$b.FlatStyle='Flat';$b.BackColor=[Drawing.ColorTranslator]::FromHtml('#465780');$b.ForeColor=[Drawing.Color]::White}
$header.Controls.AddRange(@($title,$subtitle,$search,$searchLabel,$install,$open));$form.Controls.Add($grid);$form.Controls.Add($footer);$form.Controls.Add($header)
if($SelfTest){$form.Show();[Windows.Forms.Application]::DoEvents();if($script:cards.Count -ne 16){throw 'Missing cards'};$search.Text='tatsumaki';[Windows.Forms.Application]::DoEvents();if(@($script:cards|Where-Object Visible).Count -ne 2){throw 'Search failed'};$search.Text='';[Windows.Forms.Application]::DoEvents();$bmp=New-Object Drawing.Bitmap($form.Width,$form.Height);$form.DrawToBitmap($bmp,(New-Object Drawing.Rectangle(0,0,$form.Width,$form.Height)));$bmp.Save((Join-Path $root 'docs/theme-selector.png'));$bmp.Dispose();$form.Hide();'16 cards, previews and search: OK'}else{[void]$form.ShowDialog()}
foreach($img in $script:images){$img.Dispose()};$form.Dispose()
