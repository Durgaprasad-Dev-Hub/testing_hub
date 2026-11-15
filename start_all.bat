@echo off
echo ========================================================
echo   Launching Vibe Shield AI Full Stack System
echo ========================================================
echo.
echo 1. Starting Backend in a separate window...
start "Vibe Shield AI - Backend" cmd /c "%~dp0run_backend.bat"

echo Waiting for backend API to initialize...
timeout /t 2 /nobreak >nul

echo 2. Starting Frontend in a separate window...
start "Vibe Shield AI - Frontend" cmd /c "%~dp0run_frontend.bat"

echo.
echo ========================================================
echo   Vibe Shield AI is active!
echo   - Web Dashboard:  http://localhost:5173
echo   - Backend API:    http://localhost:8000
echo   - Swagger Docs:   http://localhost:8000/api/docs
echo.
echo   Demo sample: samples/vulnerable-app.zip
echo ========================================================
