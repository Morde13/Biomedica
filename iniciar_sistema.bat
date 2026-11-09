@echo off
echo ======================================================
echo   Iniciando Sistema Labora (FastAPI + React Vite)
echo ======================================================
start "FastAPI Backend (Puerto 8000)" cmd /k "cd /d %~dp0 && .\env\Scripts\uvicorn.exe main:app --reload --host 127.0.0.1 --port 8000"
start "React Frontend (Puerto 5173)" cmd /k "cd /d %~dp0\frontend && npm run dev"
echo.
echo Servidor Backend: http://127.0.0.1:8000/docs
echo Interfaz React:   http://localhost:5173
pause
