@echo off
set "ROOT=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$w = New-Object -ComObject WScript.Shell; $d = [Environment]::GetFolderPath('Desktop'); foreach ($pair in @(@('Order Agent','Order Agent.exe'), @('Group Agent','Group Agent.exe'))) { $s = $w.CreateShortcut((Join-Path $d ($pair[0] + '.lnk'))); $s.TargetPath = (Join-Path $env:ROOT $pair[1]); $s.WorkingDirectory = $env:ROOT; $s.Save() }"
echo Desktop shortcuts are ready: Order Agent and Group Agent.
pause
