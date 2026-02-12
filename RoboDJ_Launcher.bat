@echo off
setlocal

:: Launch RoboDJ Automation as Administrator using paths relative to this launcher.
set "launcher_dir=%~dp0"
set "exe_path=%launcher_dir%RoboDJ Automation.exe"

if not exist "%exe_path%" (
    echo Error: "RoboDJ Automation.exe" was not found next to this launcher.
    echo Expected path: "%exe_path%"
    exit /b 1
)

powershell -NoProfile -Command "Start-Process -FilePath '%exe_path%' -WorkingDirectory '%launcher_dir%' -Verb RunAs"
