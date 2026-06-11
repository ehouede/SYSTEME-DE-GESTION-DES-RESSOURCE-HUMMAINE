@echo off
REM Script to start backend (Django) and frontend (Vite) in separate console windows

REM Start Backend (Django)
REM Start Backend (Django) using backend\start-backend.bat which handles venv activation
if exist "%~dp0backend\start-backend.bat" (
	start "Backend" cmd /k "cd /d %~dp0backend && start-backend.bat"
) else (
	start "Backend" cmd /k "cd /d %~dp0backend && python manage.py runserver 127.0.0.1:8000"
)

REM Start Frontend (Vite)
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

exit /b 0
