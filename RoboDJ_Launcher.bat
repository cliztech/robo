@echo off
setlocal

:: Compatibility shim: route legacy launcher filename to the DGN-DJ branded launcher.
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
set "DGNDJ_LAUNCHER=%SCRIPT_DIR%\DGN-DJ_Launcher.bat"

if not exist "%DGNDJ_LAUNCHER%" (
    echo [DGN-DJ] ERROR: DGN-DJ launcher is missing.
    echo [DGN-DJ] Expected path: "%DGNDJ_LAUNCHER%"
    exit /b 1
)

call "%DGNDJ_LAUNCHER%"
set "LAUNCH_EXIT=%ERRORLEVEL%"

endlocal & exit /b %LAUNCH_EXIT%
