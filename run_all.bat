@echo off
title InsightFlow BI - Service Launcher
echo =====================================================================
echo                 InsightFlow BI Service Launcher
echo =====================================================================
echo.

echo [*] Starting Django API Backend Server (port 8000)...
start "Django Backend Server" cmd /k "cd Backend && .\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000"

echo [*] Starting Celery Background Task Runner (Worker)...
start "Celery Task Worker" cmd /k "cd Backend && .\venv\Scripts\celery.exe -A config worker --loglevel=info -P threads"

echo [*] Starting Vite React Frontend Dev Server...
start "Vite React Frontend" cmd /k "cd Frontend\frontend && npm run dev"

echo.
echo =====================================================================
echo [✔] Services launched in separate background terminal windows!
echo     - Backend API Base: http://127.0.0.1:8000/api/v1/
echo     - Frontend Dashboard: http://localhost:5173/
echo =====================================================================
echo.
pause
