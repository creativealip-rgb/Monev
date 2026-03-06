@echo off
REM ============================================
REM Monev - Kill Background Node.js Processes
REM ============================================
REM This script kills all Node.js processes that may be holding ports
REM Usage: Run as administrator for best results

echo.
echo ==========================================
echo  Monev - Kill Background Processes
echo ==========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Running as Administrator
) else (
    echo [WARN] Not running as Administrator
    echo Some processes may not be killed
    echo.
)

echo.
echo [1/3] Finding Node.js processes...
echo.

REM List all Node processes
tasklist /FI "IMAGENAME eq node.exe" /FO TABLE 2>nul

if %errorLevel% == 1 (
    echo [INFO] No Node.js processes found
    goto :end
)

echo.
echo [2/3] Killing Node.js processes...
echo.

REM Kill all Node.js processes
taskkill /F /IM node.exe

if %errorLevel% == 0 (
    echo [OK] All Node.js processes killed successfully
) else (
    echo [WARN] Some processes could not be killed
    echo Try running this script as Administrator
)

echo.
echo [3/3] Cleaning up...
echo.

REM Wait a moment for processes to fully terminate
timeout /t 2 /nobreak >nul

REM Clean up .next cache (optional - uncomment if needed)
REM echo Cleaning .next cache...
REM if exist ".next" (
REM     rmdir /s /q .next
REM     echo [OK] .next cache cleaned
REM )

echo.
echo ==========================================
echo  Done! You can now run: npm run dev
echo ==========================================
echo.

:end
pause
