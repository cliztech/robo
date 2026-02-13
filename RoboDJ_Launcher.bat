@echo off
setlocal

:: Resolve launcher location so this script remains portable across install paths.
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

set "EXE_PATH=%SCRIPT_DIR%\RoboDJ Automation.exe"
set "VALIDATOR_PATH=%SCRIPT_DIR%\config\validate_config.py"

if not exist "%EXE_PATH%" (
    echo [RoboDJ] ERROR: Unable to find RoboDJ Automation executable.
    echo [RoboDJ] Expected path: "%EXE_PATH%"
    exit /b 1
)

if not exist "%VALIDATOR_PATH%" (
    echo [RoboDJ] ERROR: Missing startup preflight validator.
    echo [RoboDJ] Expected path: "%VALIDATOR_PATH%"
    exit /b 1
)

echo [RoboDJ] Startup preflight: validating configuration...
set "PYTHON_CMD=python"
python --version >nul 2>&1
if errorlevel 1 (
    set "PYTHON_CMD=py -3"
    py -3 --version >nul 2>&1
    if errorlevel 1 (
        echo [RoboDJ] ERROR: Python runtime was not found.
        echo [RoboDJ] Install Python 3.x and rerun this launcher.
        exit /b 1
    )
)

pushd "%SCRIPT_DIR%" >nul
call %PYTHON_CMD% "%VALIDATOR_PATH%"
set "VALIDATION_EXIT=%ERRORLEVEL%"
popd >nul

if not "%VALIDATION_EXIT%"=="0" (
    echo [RoboDJ] ERROR: Startup blocked because configuration validation failed.
    echo [RoboDJ] Resolve the errors shown above, then rerun this launcher.
    exit /b %VALIDATION_EXIT%
)

:: Launch RoboDJ Automation as Administrator to handle permission-sensitive operations.
set "ROBO_EXE_PATH=%EXE_PATH%"
set "ROBO_WORK_DIR=%SCRIPT_DIR%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath $env:ROBO_EXE_PATH -WorkingDirectory $env:ROBO_WORK_DIR -Verb RunAs"
set "PS_EXIT=%ERRORLEVEL%"

endlocal & exit /b %PS_EXIT%
