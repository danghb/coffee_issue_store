@echo off
setlocal
echo ==========================================
echo      Cleaning Database Issues...
echo ==========================================

cd /d "%~dp0backend"

call npx ts-node scripts/clear_issues.ts

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to clean database.
    color 0C
) else (
    echo.
    echo [SUCCESS] Database cleaned successfully.
    color 0A
)

echo.
pause
color
