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
:: Resolve launcher location so this script remains portable across install paths.
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

set "EXE_PATH=%SCRIPT_DIR%\RoboDJ Automation.exe"

if not exist "%EXE_PATH%" (
    echo [RoboDJ] ERROR: Unable to find RoboDJ Automation executable.
    echo [RoboDJ] Expected path: "%EXE_PATH%"
    exit /b 1
)

:: Launches RoboDJ Automation as Administrator to fix permission issues.
set "ROBO_EXE_PATH=%EXE_PATH%"
set "ROBO_WORK_DIR=%SCRIPT_DIR%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath $env:ROBO_EXE_PATH -WorkingDirectory $env:ROBO_WORK_DIR -Verb RunAs"
set "PS_EXIT=%ERRORLEVEL%"

endlocal & exit /b %PS_EXIT%
