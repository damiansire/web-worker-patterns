@echo off
REM Script para Windows para iniciar el proyecto con Docker
REM Compatible con Command Prompt y PowerShell

setlocal enabledelayedexpansion

REM Habilitar colores ANSI en Windows 10+
reg add HKCU\Console /v VirtualTerminalLevel /t REG_DWORD /d 1 /f >nul 2>&1

echo.
echo =====================================
echo   Web Worker Patterns - Setup
echo =====================================
echo.

REM Verificar si Docker esta instalado
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Docker no esta instalado
    echo.
    echo Por favor, instala Docker Desktop desde:
    echo https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)
echo [OK] Docker esta instalado

REM Verificar si Docker esta corriendo
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Docker no esta corriendo
    echo.
    echo Intentando iniciar Docker Desktop automaticamente...
    
    REM Intentar iniciar Docker Desktop
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        echo Esperando a que Docker Desktop inicie...
        echo (Esto puede tomar 20-40 segundos)
        echo.
        
        REM Esperar hasta 60 segundos a que Docker inicie
        set /a counter=0
        :wait_loop
        timeout /t 2 /nobreak >nul
        docker info >nul 2>&1
        if %errorlevel% equ 0 (
            echo.
            echo [OK] Docker iniciado correctamente
            goto docker_ready
        )
        
        set /a counter+=2
        if !counter! lss 60 (
            echo|set /p="."
            goto wait_loop
        )
        
        echo.
        echo [X] Docker tardo demasiado en iniciar
        echo.
        echo Por favor:
        echo 1. Verifica que Docker Desktop este iniciando (icono en la bandeja)
        echo 2. Espera unos segundos mas
        echo 3. Ejecuta este script nuevamente
        echo.
        pause
        exit /b 1
    ) else (
        echo [X] Docker Desktop no encontrado en la ruta por defecto
        echo.
        echo Por favor, inicia Docker Desktop manualmente:
        echo 1. Busca "Docker Desktop" en el menu inicio
        echo 2. Haz clic para iniciarlo
        echo 3. Espera a ver el icono en la bandeja del sistema
        echo 4. Ejecuta este script nuevamente
        echo.
        pause
        exit /b 1
    )
)

:docker_ready
echo [OK] Docker esta corriendo
echo.

REM Levantar el contenedor
echo Levantando contenedor con Docker Compose...
echo (Esto puede tomar un momento la primera vez)
echo.
docker-compose up -d --build

if %errorlevel% neq 0 (
    echo.
    echo [X] Error al levantar el contenedor
    echo.
    echo Posibles soluciones:
    echo 1. Verifica que el puerto 9000 este disponible
    echo 2. Ejecuta: docker-compose down
    echo 3. Intenta nuevamente
    echo.
    pause
    exit /b 1
)

echo.
echo =====================================
echo   *** Listo! ***
echo =====================================
echo.
echo Abre tu navegador en:
echo    ^>^>^> http://localhost:9000
echo.
echo Comandos utiles:
echo    Ver logs:      docker-compose logs -f
echo    Detener:       docker-compose down
echo    Reiniciar:     docker-compose restart
echo.
echo.
echo Presiona cualquier tecla para abrir en el navegador...
pause >nul

REM Intentar abrir el navegador automaticamente
start http://localhost:9000

echo.
echo [OK] Navegador abierto
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul
