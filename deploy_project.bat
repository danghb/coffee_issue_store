@echo off
setlocal

echo ==========================================
echo      Initializing Project Deployment
echo ==========================================

cd /d "%~dp0"

echo.
echo [1/5] Installing Backend Dependencies...
cd backend
call npm install
if %errorlevel% neq 0 goto :error

echo.
echo [2/5] Installing Frontend Dependencies...
cd ../frontend
call npm install
if %errorlevel% neq 0 goto :error

echo.
echo [3/5] Generating Prisma Client...
cd ../backend
call npx prisma generate
if %errorlevel% neq 0 goto :error

echo.
echo [4/5] Pushing Database Schema...
call npx prisma db push
if %errorlevel% neq 0 goto :error

echo.
echo [5/5] Seeding Initial Data...
call npx prisma db seed
if %errorlevel% neq 0 goto :error

echo.
echo ==========================================
echo      Deployment Completed Successfully
echo ==========================================
echo.
echo You can now start the services:
echo   Backend:  cd backend ^& npm run dev
echo   Frontend: cd frontend ^& npm run dev
echo.
pause
exit /b 0

:error
echo.
echo [ERROR] Deployment failed.
pause
exit /b 1
