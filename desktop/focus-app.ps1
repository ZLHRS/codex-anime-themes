param([Parameter(Mandatory=$true)][string]$AppPath)
$ErrorActionPreference='Stop'
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public static class ThemeWindow {
 public delegate bool Callback(IntPtr h, IntPtr p);
 [DllImport("user32.dll")] public static extern bool EnumWindows(Callback cb,IntPtr p);
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h,out uint pid);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h,StringBuilder s,int n);
 [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr h,int n);
 [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
 [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
 [DllImport("user32.dll")] public static extern int GetWindowLong(IntPtr h,int index);
}
"@
$expected=[IO.Path]::GetFullPath($AppPath)
$processIds=@(Get-Process | Where-Object {try{[string]::Equals($_.Path,$expected,[StringComparison]::OrdinalIgnoreCase)}catch{$false}} | Select-Object -ExpandProperty Id)
$script:found=[IntPtr]::Zero
[ThemeWindow]::EnumWindows({param($handle,$unused)
 $ownerId=[uint32]0
 [void][ThemeWindow]::GetWindowThreadProcessId($handle,[ref]$ownerId)
 # Never activate tool/overlay windows: they can be transparent and topmost.
 $extendedStyle=[ThemeWindow]::GetWindowLong($handle,-20)
 if(($extendedStyle -band 0x80) -ne 0 -or ($extendedStyle -band 0x08000000) -ne 0){return $true}
 if($ownerId -in $processIds){$title=New-Object Text.StringBuilder 512;[void][ThemeWindow]::GetWindowText($handle,$title,512);if($title.ToString() -match 'ChatGPT|Codex'){$script:found=$handle;return $false}}
 return $true
},[IntPtr]::Zero) | Out-Null
if($script:found -eq [IntPtr]::Zero){throw 'ChatGPT window is not ready.'}
$mode=if([ThemeWindow]::IsIconic($script:found)){9}else{5}
[void][ThemeWindow]::ShowWindowAsync($script:found,$mode)
[void][ThemeWindow]::SetForegroundWindow($script:found)
