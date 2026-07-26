@echo off
echo ===================================================
echo Starting Backend (Python HTTP Server) on port 8000...
echo ===================================================
start cmd /k "cd backend && py main.py"

echo.
echo ===================================================
echo Starting Frontend (Next.js) on port 3000...
echo ===================================================
start cmd /k "cd frontend && npm run dev"

echo.
echo Waiting 5 seconds for servers to initialize...
timeout /t 5 >nul

echo Opening browser at http://127.0.0.1:3000...
start http://127.0.0.1:3000

echo.
echo Both servers have been started!
echo If you want to stop them, run stop_servers.bat.
pause
