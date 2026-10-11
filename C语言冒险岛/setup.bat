@echo off
setlocal
set "DEST=D:\Tools\C语言冒险岛"
rem 安装包为满足自解压存根的长度约束，压缩包里带了一个未压缩占位条目，
rem 复制到安装目录之前先删掉，避免多出一个几百 MB 的垃圾文件。
del /f /q "%~dp0_padding_do_not_extract.bin" 2>nul
if not exist "%DEST%" mkdir "%DEST%"
xcopy /E /I /Y "%~dp0." "%DEST%" >nul
powershell -NoProfile -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('C:\Users\chuan\Desktop\C 语言冒险岛.lnk'); $s.TargetPath='D:\Tools\C语言冒险岛\C++ 冒险岛.exe'; $s.WorkingDirectory='D:\Tools\C语言冒险岛\resources\app'; $s.IconLocation='D:\Tools\C语言冒险岛\resources\app\icon.ico,0'; $s.Save()"
start "" "D:\Tools\C语言冒险岛\C++ 冒险岛.exe"
endlocal