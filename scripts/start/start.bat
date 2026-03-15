@echo off
REM Inicia la app en Windows. Misma lógica que npm run dev (script Node multiplataforma).
cd /d "%~dp0..\.."
node scripts\start\start.cjs
exit /b %errorlevel%
