@echo off
echo Starting backend...
cd backend
start "Backend" cmd /k "npm install && npm run dev"
cd ..

echo Starting frontend...
cd frontend
start "Frontend" cmd /k "npm install && npm run dev"
cd ..

echo.
echo Both frontend and backend are starting in new windows.
echo You can close this window.
