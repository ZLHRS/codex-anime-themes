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
function Save-Theme([string]$id){
 if($catalog.id -notcontains $id){throw 'Неизвестная тема.'}
 $tmp=$config+'.tmp';[IO.File]::WriteAllText($tmp,(@{theme=$id}|ConvertTo-Json),[Text.UTF8Encoding]::new($false));Move-Item -LiteralPath $tmp -Destination $config -Force
}
function Open-ThemedApp([string]$id){
 if(Get-Process -Name codex-app-manager -ErrorAction SilentlyContinue){throw 'Закройте Codex App Manager: он может возвращать старое оформление.'}
 $ready=$false;try{$null=Invoke-RestMethod 'http://127.0.0.1:9345/json/list' -TimeoutSec 2;$ready=$true}catch{}
 if(-not $ready){
  if(Get-Process -Name ChatGPT -ErrorAction SilentlyContinue){throw 'ChatGPT уже открыт обычным способом. Полностью закройте его и откройте новым ярлыком ChatGPT с рабочего стола.'}
  $package=Get-AppxPackage -Name OpenAI.Codex|Select-Object -First 1
  if(-not $package){throw 'Не найден установленный Codex / ChatGPT для Windows (OpenAI.Codex).'}
  $exe=Join-Path $package.InstallLocation 'app/ChatGPT.exe';if(-not(Test-Path $exe)){throw 'Эта сборка приложения пока не поддерживается.'}
 }
 Save-Theme $id
 if(-not $ready){Start-Process $exe -ArgumentList '--remote-debugging-address=127.0.0.1','--remote-debugging-port=9345'}
 Start-Process powershell.exe -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -File "'+(Join-Path $root 'launcher/Theme-Engine.ps1')+'" -Worker') -WindowStyle Hidden
}
if($Launch){try{Open-ThemedApp $script:selected}catch{[void][Windows.Forms.MessageBox]::Show($_.Exception.Message,'ChatGPT — запуск с темой')};return}
Add-Type -AssemblyName PresentationFramework,PresentationCore,WindowsBase
[xml]$xaml=@"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation" xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml" Title="ZLHRS Theme Studio — Скины" Width="1140" Height="820" MinWidth="1020" MinHeight="660" WindowStartupLocation="CenterScreen" Background="#0e1017" Foreground="#e6e7ee" FontFamily="Segoe UI" FontSize="13">
<Window.Resources>
<Style TargetType="Button"><Setter Property="Foreground" Value="#e6e7ee"/><Setter Property="Background" Value="#1c1f28"/><Setter Property="BorderBrush" Value="#3c404e"/><Setter Property="Padding" Value="14,7"/><Setter Property="Cursor" Value="Hand"/><Setter Property="Template"><Setter.Value><ControlTemplate TargetType="Button"><Border x:Name="edge" CornerRadius="10" Background="{TemplateBinding Background}" BorderBrush="{TemplateBinding BorderBrush}" BorderThickness="1" Padding="{TemplateBinding Padding}"><ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/></Border><ControlTemplate.Triggers><Trigger Property="IsMouseOver" Value="True"><Setter TargetName="edge" Property="Opacity" Value="0.78"/></Trigger><Trigger Property="IsEnabled" Value="False"><Setter TargetName="edge" Property="Opacity" Value="0.4"/></Trigger></ControlTemplate.Triggers></ControlTemplate></Setter.Value></Setter></Style>
<Style x:Key="Primary" TargetType="Button" BasedOn="{StaticResource {x:Type Button}}"><Setter Property="FontWeight" Value="SemiBold"/><Setter Property="BorderBrush" Value="#a2a7ff"/><Setter Property="Background"><Setter.Value><LinearGradientBrush StartPoint="0,0" EndPoint="0,1"><GradientStop Color="#939aff" Offset="0"/><GradientStop Color="#6573ee" Offset="1"/></LinearGradientBrush></Setter.Value></Setter></Style>
</Window.Resources>
<Grid><Grid.ColumnDefinitions><ColumnDefinition Width="205"/><ColumnDefinition Width="*"/></Grid.ColumnDefinitions>
<Border Background="#11131c" BorderBrush="#252936" BorderThickness="0,0,1,0"><DockPanel Margin="14,22,14,18"><StackPanel DockPanel.Dock="Top"><TextBlock Text="◈  ZLHRS Theme Studio" FontWeight="Bold" FontSize="14" Margin="2,0,0,26"/><Button Name="LaunchNav" Content="⌂   Открыть ChatGPT" HorizontalContentAlignment="Left" Margin="0,0,0,10"/><Button Content="◉   Скины" Background="#292c48" BorderBrush="#4d527e" Foreground="#bdc3ff" FontWeight="SemiBold" Margin="0,0,0,10"/><Button Name="SetupNav" Content="⚙   Настроить запуск" Margin="0,0,0,10"/><Button Name="HelpNav" Content="?   Инструкция"/></StackPanel><TextBlock Text="Последняя тема сохраняется автоматически" Foreground="#7c8194" TextWrapping="Wrap" VerticalAlignment="Bottom" Margin="8,0,8,0"/></DockPanel></Border>
<Grid Grid.Column="1" Margin="22,18,22,16"><Grid.RowDefinitions><RowDefinition Height="36"/><RowDefinition Height="62"/><RowDefinition Height="50"/><RowDefinition Height="46"/><RowDefinition Height="*"/><RowDefinition Height="24"/></Grid.RowDefinitions>
<TextBlock Text="Скины" FontSize="17" FontWeight="SemiBold"/>
<Border Grid.Row="1" CornerRadius="12" BorderBrush="#343845" BorderThickness="1" Background="#20232c" Padding="14,10" Margin="0,0,0,10"><DockPanel><Button Name="OpenLast" DockPanel.Dock="Right" Content="Открыть ChatGPT" Style="{StaticResource Primary}"/><TextBlock Name="Current" VerticalAlignment="Center" Foreground="#c4c7d4" TextTrimming="CharacterEllipsis" Margin="0,0,10,0"/></DockPanel></Border>
<Grid Grid.Row="2" Margin="0,2,0,8"><Grid.ColumnDefinitions><ColumnDefinition Width="112"/><ColumnDefinition Width="*"/><ColumnDefinition Width="92"/><ColumnDefinition Width="112"/></Grid.ColumnDefinitions><Button Content="Локальные" Background="#303441" FontWeight="SemiBold" Margin="0,0,10,0"/><Border Grid.Column="1" CornerRadius="16" BorderBrush="#3c404e" BorderThickness="1" Background="#171a23" Padding="12,6" Margin="0,0,10,0"><Grid><TextBlock Name="SearchHint" Text="⌕  Поиск по имени, описанию, автору…" Foreground="#7c8194" VerticalAlignment="Center" IsHitTestVisible="False"/><TextBox Name="Search" Background="Transparent" BorderThickness="0" Foreground="#e6e7ee" CaretBrush="White" VerticalContentAlignment="Center" ToolTip="Поиск по имени, описанию и автору"/></Grid></Border><Button Grid.Column="2" Name="View" Content="☷ Список" Margin="0,0,10,0"/><Button Grid.Column="3" Name="Manage" Content="Управление"/></Grid>
<StackPanel Grid.Row="3" Orientation="Horizontal" VerticalAlignment="Top"><Button Name="All" Content="Все  ·  16" Background="#292c48" BorderBrush="#676da7" Margin="0,0,8,0"/><Button Name="Active" Content="Выбранная" Margin="0,0,8,0"/><TextBlock Text="В комплекте · без загрузок" Foreground="#777e90" VerticalAlignment="Center" Margin="10,0,0,0"/></StackPanel>
<ScrollViewer Name="Scroll" Grid.Row="4" VerticalScrollBarVisibility="Auto" HorizontalScrollBarVisibility="Disabled"><UniformGrid Name="Cards" Columns="2"/></ScrollViewer>
<TextBlock Name="Status" Grid.Row="5" Foreground="#838a9e" FontSize="11" VerticalAlignment="Bottom" Text="Выберите тему — она будет включаться при следующем запуске новым ярлыком ChatGPT."/>
</Grid></Grid></Window>
"@
$window=[Windows.Markup.XamlReader]::Load((New-Object Xml.XmlNodeReader $xaml))
$cardsPanel=$window.FindName('Cards');$search=$window.FindName('Search');$status=$window.FindName('Status');$current=$window.FindName('Current')
$script:cards=@();$script:buttons=@();$script:listMode=$false;$script:onlyActive=$false
function Brush([string]$hex){return [Windows.Media.BrushConverter]::new().ConvertFromString($hex)}
function Update-Filter {foreach($card in $script:cards){$meta=$card.Tag;$match=($meta.name+' '+$meta.description+' '+$meta.author+' '+$meta.id).IndexOf($search.Text,[StringComparison]::OrdinalIgnoreCase) -ge 0;$card.Visibility=if($match -and (-not $script:onlyActive -or $meta.id -eq $script:selected)){'Visible'}else{'Collapsed'}}}
function Refresh-Selection {$current.Text='◈  Выбрана: '+($catalog|Where-Object id -eq $script:selected).name;foreach($b in $script:buttons){$b.Content=if($b.Tag -eq $script:selected){'✓  Выбрана'}else{'Применить'}};Update-Filter}
function Apply-Selected([string]$id){try{Save-Theme $id;$script:selected=$id;Refresh-Selection;Open-ThemedApp $id;$status.Text='Тема сохранена. Применение занимает несколько секунд.'}catch{[void][Windows.MessageBox]::Show($_.Exception.Message,'Применение темы');$status.Text='Выбор сохранён. Закройте приложение и откройте ярлыком ChatGPT — тема включится.'}}
foreach($t in $catalog){
 $meta=Get-Content (Join-Path $root ('themes/'+$t.id+'/theme.json')) -Raw -Encoding UTF8|ConvertFrom-Json
 $card=[Windows.Controls.Border]::new();$card.CornerRadius=12;$card.BorderThickness=1;$card.BorderBrush=Brush '#383d49';$card.Background=Brush '#1b1e27';$card.Margin='0,0,14,16';$card.Tag=$meta
 $stack=[Windows.Controls.StackPanel]::new();$card.Child=$stack
 $banner=[Windows.Controls.Grid]::new();$banner.Height=250;$banner.Background=Brush '#242b38';$banner.ClipToBounds=$true
 $bitmapSource=[Windows.Media.Imaging.BitmapImage]::new();$bitmapSource.BeginInit();$bitmapSource.CacheOption='OnLoad';$bitmapSource.UriSource=[Uri](Join-Path $root ('previews/'+$t.id+'-chat.jpg'));$bitmapSource.EndInit();$bitmapSource.Freeze()
 $pic=[Windows.Controls.Image]::new();$pic.Source=$bitmapSource;$pic.Stretch='Uniform';$pic.VerticalAlignment='Center';$pic.Cursor='Hand';$pic.ToolTip='Открыть крупный просмотр темы';$pic.Tag=$meta.name
 $pic.Add_MouseLeftButtonUp({param($sender,$e)
  $preview=[Windows.Window]::new();$preview.Title=$sender.Tag+' — демонстрационный чат';$preview.Owner=$window;$preview.WindowStartupLocation='CenterOwner';$preview.Width=1100;$preview.Height=730;$preview.Background=Brush '#0e1017'
  $large=[Windows.Controls.Image]::new();$large.Source=$sender.Source;$large.Stretch='Uniform';$preview.Content=$large
  $preview.Add_KeyDown({param($sender,$e) if($e.Key -eq 'Escape'){$sender.Close()}});[void]$preview.ShowDialog()
 });$banner.Children.Add($pic)|Out-Null;$stack.Children.Add($banner)|Out-Null
 $body=[Windows.Controls.StackPanel]::new();$body.Margin='15,12,15,14';$stack.Children.Add($body)|Out-Null
 $name=[Windows.Controls.TextBlock]::new();$name.Text=$meta.name;$name.FontSize=15;$name.FontWeight='SemiBold';$name.TextTrimming='CharacterEllipsis';$body.Children.Add($name)|Out-Null
 $version=[Windows.Controls.TextBlock]::new();$version.Text='v'+$meta.version+'   @'+$meta.author;$version.Foreground=Brush '#868c9c';$version.FontSize=11;$version.Margin='0,6,0,0';$body.Children.Add($version)|Out-Null
 $desc=[Windows.Controls.TextBlock]::new();$desc.Text=$meta.description;$desc.Foreground=Brush '#b1b5c3';$desc.FontSize=12;$desc.TextWrapping='Wrap';$desc.Height=36;$desc.Margin='0,8,0,0';$body.Children.Add($desc)|Out-Null
 $swatches=[Windows.Controls.StackPanel]::new();$swatches.Orientation='Horizontal';$swatches.Margin='0,6,0,10'
 foreach($color in $meta.colors.PSObject.Properties){try{$swatch=[Windows.Controls.Border]::new();$swatch.Width=16;$swatch.Height=16;$swatch.CornerRadius=4;$swatch.Background=Brush $color.Value;$swatch.Margin='0,0,5,0';$swatches.Children.Add($swatch)|Out-Null}catch{}}
 $body.Children.Add($swatches)|Out-Null
 $actions=[Windows.Controls.DockPanel]::new()
 $details=[Windows.Controls.Button]::new();$details.Content='ⓘ';$details.Tag=$meta;$details.Width=34;$details.Padding=3;$details.Margin='8,0,0,0';$details.ToolTip='Подробности';[Windows.Controls.DockPanel]::SetDock($details,'Right');$details.Add_Click({param($sender,$e) $m=$sender.Tag;[void][Windows.MessageBox]::Show(($m.name+"`n`n"+$m.description+"`n`nВерсия: "+$m.version+"`nАвтор: "+$m.author),'О теме')});$actions.Children.Add($details)|Out-Null
 $btn=[Windows.Controls.Button]::new();$btn.Style=$window.FindResource('Primary');$btn.Tag=$t.id;$btn.Add_Click({param($sender,$e) Apply-Selected $sender.Tag});$actions.Children.Add($btn)|Out-Null;$body.Children.Add($actions)|Out-Null
 $cardsPanel.Children.Add($card)|Out-Null;$script:cards+=$card;$script:buttons+=$btn
}
$search.Add_TextChanged({$window.FindName('SearchHint').Visibility=if($search.Text.Length){'Collapsed'}else{'Visible'};Update-Filter})
$window.FindName('All').Add_Click({$script:onlyActive=$false;Update-Filter})
$window.FindName('Active').Add_Click({$script:onlyActive=$true;Update-Filter})
$window.FindName('View').Add_Click({$script:listMode=-not $script:listMode;$cardsPanel.Columns=if($script:listMode){1}else{2};$window.FindName('View').Content=if($script:listMode){'▦ Карточки'}else{'☷ Список'};foreach($c in $script:cards){$c.Child.Children[0].Height=if($script:listMode){420}else{250}}})
$window.FindName('OpenLast').Add_Click({Apply-Selected $script:selected});$window.FindName('LaunchNav').Add_Click({Apply-Selected $script:selected})
$setup={try{& (Join-Path $root 'Install-Studio.ps1');$status.Text='Ярлыки ChatGPT и Theme Studio обновлены.'}catch{[void][Windows.MessageBox]::Show($_.Exception.Message,'Настройка запуска')}}
$window.FindName('SetupNav').Add_Click($setup);$window.FindName('Manage').Add_Click($setup)
$window.FindName('HelpNav').Add_Click({Start-Process (Join-Path $root 'docs/START-HERE.txt')})
Refresh-Selection
if($SelfTest){
 $window.Show();$window.UpdateLayout()
 if($cardsPanel.Children.Count -ne 16){throw 'Missing cards'}
 $search.Text='tatsumaki';if(@($script:cards|Where-Object Visibility -eq 'Visible').Count -ne 2){throw 'Search failed'};$search.Text=''
 $script:onlyActive=$true;Update-Filter;if(@($script:cards|Where-Object Visibility -eq 'Visible').Count -ne 1){throw 'Selection filter failed'};$script:onlyActive=$false;Update-Filter
 $window.UpdateLayout();$bitmap=[Windows.Media.Imaging.RenderTargetBitmap]::new([int]$window.ActualWidth,[int]$window.ActualHeight,96,96,[Windows.Media.PixelFormats]::Pbgra32);$bitmap.Render($window)
 $encoder=[Windows.Media.Imaging.PngBitmapEncoder]::new();$encoder.Frames.Add([Windows.Media.Imaging.BitmapFrame]::Create($bitmap));$file=[IO.File]::Create((Join-Path $root 'docs/theme-selector.png'));$encoder.Save($file);$file.Dispose();$window.Close();'16 cards, search and active filter: OK'
}else{[void]$window.ShowDialog()}
