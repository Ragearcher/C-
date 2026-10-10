@echo off
setlocal
set "DEST=D:\Tools\C语言冒险岛"
if not exist "%DEST%" mkdir "%DEST%"
xcopy /E /I /Y "%~dp0." "%DEST%" >nul
powershell -NoProfile -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('C:\Users\chuan\Desktop\C 语言冒险岛.lnk'); $s.TargetPath='D:\Tools\C语言冒险岛\C++ 冒险岛.exe'; $s.WorkingDirectory='D:\Tools\C语言冒险岛\resources\app'; $s.IconLocation='D:\Tools\C语言冒险岛\resources\app\icon.ico,0'; $s.Save()"
start "" "D:\Tools\C语言冒险岛\C++ 冒险岛.exe"
endlocal