@echo off
REM Start backend with virtualenv activation if available
cd /d %~dp0

nREM Check for venv inside backend folder
if exist "venv\Scripts\activate.bat" (
  echo Activating venv in backend\venv
  call "venv\Scripts\activate.bat"
) else if exist "..\venv\Scripts\activate.bat" (
  echo Activating venv in root\venv
  call "..\venv\Scripts\activate.bat"
) else (
  echo Warning: no virtualenv activate script found. Continuing without venv.
)

python manage.py runserver 127.0.0.1:8000
