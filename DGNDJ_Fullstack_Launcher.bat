@echo off
setlocal EnableExtensions EnableDelayedExpansion

:: DGN-DJ Fullstack Launcher (Windows)
:: - Dev mode: install deps (if needed) + run `npm run dev`
:: - Prod mode: install deps (if needed) + `npm run build` + `npm run start`
::
:: Usage:
::   DGNDJ_Fullstack_Launcher.bat                  -> dev mode (default)
::   DGNDJ_Fullstack_Launcher.bat dev              -> dev mode
::   DGNDJ_Fullstack_Launcher.bat prod             -> production-style local run
::   DGNDJ_Fullstack_Launcher.bat --port 3001      -> dev mode on port 3001
::   DGNDJ_Fullstack_Launcher.bat prod --port 4000 -> prod mode on port 4000
::   DGNDJ_Fullstack_Launcher.bat --help

set "MODE=dev"
set "PORT_VALUE=%PORT%"
if "%PORT_VALUE%"=="" set "PORT_VALUE=3000"
set "NEXT_TELEMETRY_DISABLED=1"

:parse_args
if "%~1"=="" goto :args_done
if /I "%~1"=="dev" (
    set "MODE=dev"
    shift
    goto :parse_args
)
if /I "%~1"=="prod" (
    set "MODE=prod"
    shift
    goto :parse_args
)
if /I "%~1"=="--port" (
    if "%~2"=="" (
        echo [DGN-DJ] ERROR: --port requires a value.
        goto :usage_error
    )
    set "PORT_VALUE=%~2"
    shift
    shift
    goto :parse_args
)
if /I "%~1"=="--help" goto :usage
if /I "%~1"=="-h" goto :usage

echo [DGN-DJ] ERROR: Unknown argument "%~1".
goto :usage_error

:args_done
setlocal

:: DGN-DJ Fullstack Launcher (Windows)
:: - Verifies Node/npm availability
:: - Ensures dependencies are present
:: - Starts the Next.js full-stack runtime (frontend + API routes)

set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

if "%PORT_VALUE%"=="" set "PORT_VALUE=3000"

pushd "%SCRIPT_DIR%"

echo [DGN-DJ] ============================================================
echo [DGN-DJ] Fullstack launcher mode: %MODE%
echo [DGN-DJ] Working directory: "%SCRIPT_DIR%"
echo [DGN-DJ] Local URL target: http://localhost:%PORT_VALUE%
echo [DGN-DJ] ============================================================
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

for /f "tokens=1 delims=." %%v in ('node -p "process.versions.node"') do set "NODE_MAJOR=%%v"
if "%NODE_MAJOR%"=="" set "NODE_MAJOR=0"
if %NODE_MAJOR% LSS 20 (
    echo [DGN-DJ] ERROR: Node.js 20+ is required. Detected major version: %NODE_MAJOR%
    popd
    exit /b 1
)

if not exist "package.json" (
    echo [DGN-DJ] ERROR: package.json not found in launcher directory.
    popd
    exit /b 1
)

if not exist "next.config.js" (
    echo [DGN-DJ] WARNING: next.config.js not found. Continuing anyway.
)

if not exist ".env.local" (
    echo [DGN-DJ] WARNING: .env.local is missing. API-backed features may fail until configured.
)

if not exist "node_modules" (
    if exist "package-lock.json" (
        echo [DGN-DJ] Installing dependencies using npm ci...
        call npm ci
    ) else (
        echo [DGN-DJ] Installing dependencies using npm install...
        call npm install
    )

    if not %ERRORLEVEL%==0 (
        echo [DGN-DJ] ERROR: dependency installation failed.
        popd
        exit /b 1
    )
) else (
    echo [DGN-DJ] Dependencies already present (node_modules found).
)

if /I "%MODE%"=="prod" goto :run_prod

echo [DGN-DJ] Starting development full-stack runtime...
call npm run dev -- --port %PORT_VALUE%
set "APP_EXIT=%ERRORLEVEL%"
goto :exit

:run_prod
echo [DGN-DJ] Building optimized production bundle...
call npm run build
if not %ERRORLEVEL%==0 (
    echo [DGN-DJ] ERROR: Production build failed.
    set "APP_EXIT=1"
    goto :exit
)

echo [DGN-DJ] Starting production server...
call npm run start -- --port %PORT_VALUE%
set "APP_EXIT=%ERRORLEVEL%"
goto :exit

:usage
echo Usage:
echo   DGNDJ_Fullstack_Launcher.bat [dev^|prod] [--port N]
echo.
echo Options:
echo   dev        Start Next.js dev server (default)
echo   prod       Build then run Next.js production server
echo   --port N   Override port (default: 3000 or PORT env var)
echo   --help     Show this help
exit /b 0

:usage_error
echo.
echo Run with --help for usage examples.
exit /b 1

:exit
popd
endlocal ^& exit /b %APP_EXIT%
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
