@echo off
setlocal

:: DGN-DJ Fullstack Launcher (Windows)
:: - Verifies Node/npm availability
:: - Ensures dependencies are present
:: - Starts the Next.js full-stack runtime (frontend + API routes)

set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

pushd "%SCRIPT_DIR%"

echo [DGN-DJ] Starting fullstack launcher from "%SCRIPT_DIR%"...

where node >nul 2>nul
if not %ERRORLEVEL%==0 (
    echo [DGN-DJ] ERROR: Node.js was not found on PATH.
    echo [DGN-DJ] Install Node.js 20.x LTS and retry.
    popd
    exit /b 1
)

where npm >nul 2>nul
if not %ERRORLEVEL%==0 (
    echo [DGN-DJ] ERROR: npm was not found on PATH.
    echo [DGN-DJ] Reinstall Node.js (includes npm) and retry.
    popd
    exit /b 1
)

if not exist "package.json" (
    echo [DGN-DJ] ERROR: package.json not found in launcher directory.
    popd
    exit /b 1
)

if not exist "node_modules" (
    echo [DGN-DJ] node_modules missing - installing dependencies...
    call npm install
    if not %ERRORLEVEL%==0 (
        echo [DGN-DJ] ERROR: npm install failed.
        popd
        exit /b 1
    )
)

echo [DGN-DJ] Launching Next.js full-stack dev server on http://localhost:3000
call npm run dev
set "DEV_EXIT=%ERRORLEVEL%"

popd
endlocal & exit /b %DEV_EXIT%
