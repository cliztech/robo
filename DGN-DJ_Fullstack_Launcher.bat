@echo off
setlocal EnableExtensions EnableDelayedExpansion

:: DGN-DJ Fullstack Launcher
:: Purpose:
::  1) Run startup safety checks
::  2) Start FastAPI backend services (uvicorn)
::  3) Launch the desktop executable with elevation

set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

set "EXE_PATH=%SCRIPT_DIR%\RoboDJ Automation.exe"
set "BACKEND_APP=backend.app:app"
set "BACKEND_HOST=127.0.0.1"
set "BACKEND_PORT=8000"
set "CONFIG_DIR=%SCRIPT_DIR%\config"
set "SCRIPTS_DIR=%CONFIG_DIR%\scripts"
set "SAFETY_SCRIPT=%SCRIPTS_DIR%\startup_safety.py"

if not exist "%EXE_PATH%" (
    echo [DGN-DJ] ERROR: Unable to find desktop executable.
    echo [DGN-DJ] Expected path: "%EXE_PATH%"
    exit /b 1
)

if not exist "%SAFETY_SCRIPT%" (
    echo [DGN-DJ] ERROR: Missing startup safety script.
    echo [DGN-DJ] Expected path: "%SAFETY_SCRIPT%"
    exit /b 1
)

set "PYTHON_CMD="
where py >nul 2>nul
if %ERRORLEVEL%==0 (
    set "PYTHON_CMD=py -3"
) else (
    where python >nul 2>nul
    if %ERRORLEVEL%==0 set "PYTHON_CMD=python"
)

if "%PYTHON_CMD%"=="" (
    echo [DGN-DJ] ERROR: Python 3 runtime was not found.
    exit /b 1
)

pushd "%SCRIPT_DIR%"
call %PYTHON_CMD% "%SAFETY_SCRIPT%" --on-launch
set "SAFETY_EXIT=%ERRORLEVEL%"
popd

if not "%SAFETY_EXIT%"=="0" (
    echo [DGN-DJ] Startup blocked by reliability safety gate.
    endlocal & exit /b %SAFETY_EXIT%
)

:: Ensure uvicorn is available before opening backend window.
call %PYTHON_CMD% -c "import uvicorn" >nul 2>nul
if not "%ERRORLEVEL%"=="0" (
    echo [DGN-DJ] ERROR: uvicorn is not installed in this Python environment.
    echo [DGN-DJ] Install with: pip install uvicorn fastapi
    endlocal & exit /b 1
)

echo [DGN-DJ] Starting backend API at http://%BACKEND_HOST%:%BACKEND_PORT%
start "DGN-DJ Backend" cmd /k "cd /d \"%SCRIPT_DIR%\" && %PYTHON_CMD% -m uvicorn %BACKEND_APP% --host %BACKEND_HOST% --port %BACKEND_PORT%"

set "ROBO_EXE_PATH=%EXE_PATH%"
set "ROBO_WORK_DIR=%SCRIPT_DIR%"

powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath $env:ROBO_EXE_PATH -WorkingDirectory $env:ROBO_WORK_DIR -Verb RunAs"
set "PS_EXIT=%ERRORLEVEL%"

if not "%PS_EXIT%"=="0" (
    echo [DGN-DJ] WARNING: Desktop executable did not launch successfully.
)

endlocal & exit /b %PS_EXIT%
