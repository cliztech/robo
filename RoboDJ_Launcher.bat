@echo off
setlocal

:: Resolve launcher location so this script remains portable across install paths.
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

set "EXE_PATH=%SCRIPT_DIR%\RoboDJ Automation.exe"
set "VALIDATOR_PATH=%SCRIPT_DIR%\config\validate_config.py"
set "VALIDATE_SCRIPT=%SCRIPT_DIR%\config\validate_config.py"

if not exist "%EXE_PATH%" (
    echo [RoboDJ] ERROR: Unable to find RoboDJ Automation executable.
    echo [RoboDJ] Expected path: "%EXE_PATH%"
    exit /b 1
)

:: Select Python launcher.
set "PYTHON_CMD=python"
where py >nul 2>nul
if %ERRORLEVEL%==0 set "PYTHON_CMD=py -3"

:: Startup diagnostics + validation + crash recovery gate.
pushd "%SCRIPT_DIR%"
call %PYTHON_CMD% config\scripts\startup_safety.py --on-launch
set "SAFETY_EXIT=%ERRORLEVEL%"
popd
if not "%SAFETY_EXIT%"=="0" (
    echo [RoboDJ] Startup blocked by reliability safety gate.
    endlocal & exit /b %SAFETY_EXIT%
)

:: Launch RoboDJ Automation as Administrator.
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
if not exist "%VALIDATE_SCRIPT%" (
    echo [RoboDJ] ERROR: Missing startup validator script.
    echo [RoboDJ] Expected path: "%VALIDATE_SCRIPT%"
    exit /b 1
)

set "PYTHON_CMD="
where py >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "PYTHON_CMD=py -3"
) else (
    where python >nul 2>&1
    if %ERRORLEVEL% EQU 0 set "PYTHON_CMD=python"
)

if "%PYTHON_CMD%"=="" (
    echo [RoboDJ] ERROR: Python runtime not found.
    echo [RoboDJ] Install Python 3 or ensure 'py'/'python' is on PATH.
    echo [RoboDJ] Startup blocked because config preflight could not run.
    exit /b 1
)

echo [RoboDJ] Running startup config preflight...
pushd "%SCRIPT_DIR%"
call %PYTHON_CMD% "%VALIDATE_SCRIPT%"
set "VALIDATION_EXIT=%ERRORLEVEL%"
popd

if not "%VALIDATION_EXIT%"=="0" (
    echo [RoboDJ] Startup blocked: configuration validation failed.
    echo [RoboDJ] Resolve the errors above, then rerun this launcher.
    exit /b %VALIDATION_EXIT%
)

:: Launch RoboDJ Automation as Administrator to fix permission issues.
set "ROBO_EXE_PATH=%EXE_PATH%"
set "ROBO_WORK_DIR=%SCRIPT_DIR%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath $env:ROBO_EXE_PATH -WorkingDirectory $env:ROBO_WORK_DIR -Verb RunAs"
set "PS_EXIT=%ERRORLEVEL%"

endlocal & exit /b %PS_EXIT%
