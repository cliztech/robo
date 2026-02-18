@echo off
setlocal

:: Directory assumptions:
::   - This launcher sits beside "RoboDJ Automation.exe".
::   - Runtime config assets live under ".\config" from this launcher directory.
:: Resolve launcher location (%~dp0) so startup is portable across machines/drives.
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

set "EXE_PATH=%SCRIPT_DIR%\RoboDJ Automation.exe"
set "CONFIG_DIR=%SCRIPT_DIR%\config"
set "SCRIPTS_DIR=%CONFIG_DIR%\scripts"
set "SAFETY_SCRIPT=%SCRIPTS_DIR%\startup_safety.py"

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
:: Run from launcher directory so any relative paths inside safety tooling resolve correctly.
pushd "%SCRIPT_DIR%"
call %PYTHON_CMD% "%SAFETY_SCRIPT%" --on-launch
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
