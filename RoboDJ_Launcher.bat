@echo off
setlocal

:: Resolve launcher location so this script remains portable across install paths.
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

set "EXE_PATH=%SCRIPT_DIR%\RoboDJ Automation.exe"
set "SAFETY_SCRIPT=%SCRIPT_DIR%\config\scripts\startup_safety.py"

if not exist "%EXE_PATH%" (
    echo [RoboDJ] ERROR: Unable to find RoboDJ Automation executable.
    echo [RoboDJ] Expected path: "%EXE_PATH%"
    exit /b 1
)

if not exist "%SAFETY_SCRIPT%" (
    echo [RoboDJ] ERROR: Missing startup safety script.
    echo [RoboDJ] Expected path: "%SAFETY_SCRIPT%"
    exit /b 1
)

:: Select Python launcher.
set "PYTHON_CMD="
where py >nul 2>nul
if %ERRORLEVEL%==0 (
    set "PYTHON_CMD=py -3"
) else (
    where python >nul 2>nul
    if %ERRORLEVEL%==0 set "PYTHON_CMD=python"
)

if "%PYTHON_CMD%"=="" (
    echo [RoboDJ] ERROR: Python runtime was not found.
    echo [RoboDJ] Install Python 3.x and rerun this launcher.
    exit /b 1
)

:: Startup diagnostics + config validation + auto-recovery + snapshot gate.
pushd "%SCRIPT_DIR%"
call %PYTHON_CMD% config\scripts\startup_safety.py --on-launch
set "SAFETY_EXIT=%ERRORLEVEL%"
popd

if not "%SAFETY_EXIT%"=="0" (
    echo [RoboDJ] Startup blocked by reliability safety gate.
    endlocal & exit /b %SAFETY_EXIT%
)

:: Launch RoboDJ Automation as Administrator to handle permission-sensitive operations.
set "ROBO_EXE_PATH=%EXE_PATH%"
set "ROBO_WORK_DIR=%SCRIPT_DIR%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath $env:ROBO_EXE_PATH -WorkingDirectory $env:ROBO_WORK_DIR -Verb RunAs"
set "PS_EXIT=%ERRORLEVEL%"

endlocal & exit /b %PS_EXIT%
