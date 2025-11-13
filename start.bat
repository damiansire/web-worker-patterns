@echo off
REM Script para Windows para iniciar la nueva app Angular del proyecto
REM Compatible con Command Prompt y PowerShell

setlocal enabledelayedexpansion

cd /d "%~dp0"

set NODE_REQUIRED_MAJOR=18
set NPM_REQUIRED_MAJOR=9
set DEV_SERVER_PORT=4200
set STAMP_FILE=node_modules\.install.stamp

echo.
echo =====================================
echo   Web Worker Patterns - Angular App
echo =====================================
echo.

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [X] Node.js no esta instalado o no esta en el PATH.
    echo Descargalo desde: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=1 delims=v" %%i in ('node -v') do set NODE_VERSION=%%i
for /f "tokens=1 delims=." %%i in ("!NODE_VERSION!") do set NODE_MAJOR=%%i

if !NODE_MAJOR! lss %NODE_REQUIRED_MAJOR% (
    echo [X] Se requiere Node.js ^>= %NODE_REQUIRED_MAJOR%.x (encontrado !NODE_VERSION!).
    echo Por favor actualiza Node.js.
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js !NODE_VERSION!

REM Verificar npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo [X] npm no esta instalado o no esta en el PATH.
    echo Instala npm desde: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=1 delims=." %%i in ('npm -v') do set NPM_MAJOR=%%i
if !NPM_MAJOR! lss %NPM_REQUIRED_MAJOR% (
    echo [X] Se requiere npm ^>= %NPM_REQUIRED_MAJOR%.x.
    echo Actualiza npm con: npm install -g npm
    echo.
    pause
    exit /b 1
)
for /f %%i in ('npm -v') do set NPM_VERSION=%%i
echo [OK] npm !NPM_VERSION!

call :ensure_dependencies
if errorlevel 1 (
    echo [X] No fue posible instalar las dependencias.
    echo.
    pause
    exit /b 1
)

echo.
echo Iniciando servidor de desarrollo Angular...
echo    URL: http://localhost:%DEV_SERVER_PORT%
echo    Usa Ctrl+C para detener el servidor.
echo.
call npm run start -- --host 0.0.0.0 --port %DEV_SERVER_PORT%
exit /b %errorlevel%

:ensure_dependencies
if not exist node_modules (
    call :install_dependencies
    exit /b %errorlevel%
)

powershell -NoProfile -Command ^
  "$stamp = Get-Item '%STAMP_FILE%' -ErrorAction SilentlyContinue; " ^
  "$lock = Get-Item 'package-lock.json'; " ^
  "if(-not $stamp -or $lock.LastWriteTimeUtc -gt $stamp.LastWriteTimeUtc) { exit 1 }"

if errorlevel 1 (
    call :install_dependencies
    exit /b %errorlevel%
)

echo [OK] Dependencias actualizadas (sin ejecutar npm install)
exit /b 0

:install_dependencies
echo.
echo Instalando dependencias del proyecto...
call npm install
if errorlevel 1 (
    echo [X] Error durante npm install.
    exit /b 1
)
powershell -NoProfile -Command "New-Item -ItemType File -Force -Path '%STAMP_FILE%' | Out-Null" >nul
echo [OK] Dependencias listas
exit /b 0
