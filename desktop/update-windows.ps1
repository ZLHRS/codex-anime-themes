param([string]$Installer,[string]$Target,[int]$StudioPid,[string]$ResultFile)
$ErrorActionPreference='Stop'
try {
 for($i=0;$i -lt 60 -and (Get-Process -Id $StudioPid -ErrorAction SilentlyContinue);$i++){Start-Sleep -Milliseconds 500}
 if(Get-Process -Id $StudioPid -ErrorAction SilentlyContinue){throw 'Theme Studio не завершилось. Обновление отменено.'}
 $process=Start-Process -FilePath $Installer -ArgumentList ('/S /D='+(Split-Path -Parent $Target)) -PassThru -Wait -WindowStyle Hidden
 if($process.ExitCode -ne 0){throw "Установщик завершился с кодом $($process.ExitCode)"}
 [IO.File]::WriteAllText($ResultFile,'Обновление установлено. Последняя тема сохранена.',[Text.UTF8Encoding]::new($false))
} catch {
 [IO.File]::WriteAllText($ResultFile,('Не удалось обновить: '+$_.Exception.Message),[Text.UTF8Encoding]::new($false))
}
if(Test-Path -LiteralPath $Target){Start-Process -FilePath $Target -WindowStyle Hidden}
