@echo off
echo ========================================================
echo   Starting Vibe Shield AI - Frontend (React + Vite)
echo ========================================================
cd /d "%~dp0frontend"
echo.
echo Launching Vite Development Server on http://localhost:5173
echo.
npm run dev
pause
