param([Parameter(Mandatory=$true)][string]$AppPath)
$ErrorActionPreference='Stop'
$expected=[IO.Path]::GetFullPath($AppPath)
$matching=@(Get-CimInstance Win32_Process | Where-Object {
    $_.ExecutablePath -and [string]::Equals($_.ExecutablePath,$expected,[StringComparison]::OrdinalIgnoreCase) -and $_.CommandLine -notmatch '--type='
})
foreach($item in $matching){
    # Try a normal close first, then stop only this verified main process.
    try{& taskkill.exe /PID $item.ProcessId 2>$null | Out-Null}catch{}
    $process=Get-Process -Id $item.ProcessId -ErrorAction SilentlyContinue
    if($process -and -not $process.WaitForExit(2000)){
        $current=Get-CimInstance Win32_Process -Filter ('ProcessId = '+$item.ProcessId)
        if($current -and $current.CreationDate -eq $item.CreationDate -and [string]::Equals($current.ExecutablePath,$expected,[StringComparison]::OrdinalIgnoreCase)){
            Stop-Process -Id $item.ProcessId -Force -ErrorAction Stop
            if(-not $process.WaitForExit(10000)){throw 'Application restart timed out.'}
        }
    }
}
