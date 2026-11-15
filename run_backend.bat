@echo off
echo ========================================================
echo   Starting Vibe Shield AI - Backend API (FastAPI)
echo ========================================================
cd /d "%~dp0backend"
echo.
echo Launching Uvicorn server on http://localhost:8000
echo API Docs available at http://localhost:8000/api/docs
echo.
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause
