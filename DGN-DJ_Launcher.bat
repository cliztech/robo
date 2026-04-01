@echo off
setlocal

:: Directory assumptions:
::   - This launcher sits beside the primary executable.
::   - Runtime config assets live under ".\config" from this launcher directory.
:: Resolve launcher location (%~dp0) so startup is portable across machines/drives.
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

set "PRIMARY_EXE_PATH=%SCRIPT_DIR%\DGN-DJ Automation.exe"
set "EXE_PATH=%PRIMARY_EXE_PATH%"
set "CONFIG_DIR=%SCRIPT_DIR%\config"
set "SCRIPTS_DIR=%CONFIG_DIR%\scripts"
set "SAFETY_SCRIPT=%SCRIPTS_DIR%\startup_safety.py"

if not exist "%EXE_PATH%" (
    echo [DGN-DJ Studio] ERROR: Unable to find core executable.
    echo [DGN-DJ Studio] Expected path: "%PRIMARY_EXE_PATH%"
    exit /b 1
)

if not exist "%SAFETY_SCRIPT%" (
    echo [DGN-DJ Studio] ERROR: Missing startup safety script.
    echo [DGN-DJ Studio] Expected path: "%SAFETY_SCRIPT%"
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
    echo [DGN-DJ Studio] ERROR: Python runtime was not found.
    echo [DGN-DJ Studio] Install Python 3.x and rerun this launcher.
    exit /b 1
)

:: Startup diagnostics + config validation + auto-recovery + snapshot gate.
:: Run from launcher directory so any relative paths inside safety tooling resolve correctly.
pushd "%SCRIPT_DIR%"
echo [DGN-DJ Studio] Running pre-flight safety checks...
call %PYTHON_CMD% "%SAFETY_SCRIPT%" --on-launch
set "SAFETY_EXIT=%ERRORLEVEL%"
popd

if not "%SAFETY_EXIT%"=="0" (
    echo [DGN-DJ Studio] Startup blocked by reliability safety gate.
    endlocal & exit /b %SAFETY_EXIT%
)

:: Launch DGN-DJ Studio as Administrator to handle permission-sensitive operations.
echo [DGN-DJ Studio] Launching Core Engine...
set "DGNDJ_EXE_PATH=%EXE_PATH%"
set "DGNDJ_WORK_DIR=%SCRIPT_DIR%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath $env:DGNDJ_EXE_PATH -WorkingDirectory $env:DGNDJ_WORK_DIR -Verb RunAs"
set "PS_EXIT=%ERRORLEVEL%"

endlocal & exit /b %PS_EXIT%
