@echo off
REM Script para Windows para iniciar el proyecto con Docker
REM Compatible con Command Prompt y PowerShell

setlocal enabledelayedexpansion

echo =====================================
echo   Web Worker Patterns - Setup
echo =====================================
echo.

REM Verificar si Docker está instalado
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [31mX Docker no esta instalado[0m
    echo.
    echo Por favor, instala Docker Desktop desde:
    echo https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo [32m✓ Docker esta instalado[0m

REM Verificar si Docker está corriendo
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [33m! Docker no esta corriendo[0m
    echo.
    echo Por favor, inicia Docker Desktop:
    echo 1. Busca "Docker Desktop" en el menu inicio
    echo 2. Haz clic para iniciarlo
    echo 3. Espera a ver el icono en la bandeja del sistema
    echo 4. Ejecuta este script nuevamente
    echo.
    pause
    exit /b 1
)
echo [32m✓ Docker esta corriendo[0m
echo.

REM Levantar el contenedor
echo [36mLevantando contenedor con Docker Compose...[0m
docker-compose up -d --build

if %errorlevel% neq 0 (
    echo.
    echo [31mX Error al levantar el contenedor[0m
    pause
    exit /b 1
)

echo.
echo [32m=====================================
echo   ✓ Listo!
echo =====================================[0m
echo.
echo [36mAbre tu navegador en:[0m
echo    http://localhost:9000
echo.
echo [36mComandos utiles:[0m
echo    Ver logs:      docker-compose logs -f
echo    Detener:       docker-compose down
echo    Reiniciar:     docker-compose restart
echo.
pause

