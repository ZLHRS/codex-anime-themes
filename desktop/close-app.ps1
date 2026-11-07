param([Parameter(Mandatory=$true)][string]$AppPath)
$ErrorActionPreference='Stop'
$expected=[IO.Path]::GetFullPath($AppPath)
$matching=@(Get-CimInstance Win32_Process | Where-Object {
    $_.ExecutablePath -and [string]::Equals($_.ExecutablePath,$expected,[StringComparison]::OrdinalIgnoreCase) -and $_.CommandLine -notmatch '--type='
})
foreach($item in $matching){
    # Request normal window shutdown; never force-kill the app or its children.
    & taskkill.exe /PID $item.ProcessId 2>&1 | Out-Null
    $process=Get-Process -Id $item.ProcessId -ErrorAction SilentlyContinue
    if($process -and -not $process.WaitForExit(15000)){
        throw 'ChatGPT did not exit normally. Save your draft and quit ChatGPT, then try again.'
    }
}
