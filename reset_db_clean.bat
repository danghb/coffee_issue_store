@echo off
setlocal

echo ==========================================
echo      Resetting Database to Clean State
echo ==========================================
echo.
echo WARNING: This will DELETE ALL DATA in the database!
echo Press Ctrl+C to cancel or any key to continue...
pause > nul

cd /d "%~dp0"

echo.
echo [0/2] Stopping Backend Service (Port 3000)...
powershell -ExecutionPolicy Bypass -File "kill_3000.ps1"

cd backend

echo.
echo [1/2] Resetting Database (Force)...
call npx prisma db push --force-reset
if %errorlevel% neq 0 goto :error

echo.
echo [2/2] Seeding Default Data...
call npx prisma db seed
if %errorlevel% neq 0 goto :error

echo.
echo ==========================================
echo      Database Reset Successfully
echo ==========================================
echo.
pause
exit /b 0

:error
echo.
echo [ERROR] Database reset failed.
pause
exit /b 1
