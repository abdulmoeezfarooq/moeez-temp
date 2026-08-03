@echo off
echo ===================================================
echo Starting Frontend (Next.js) on port 3000...
echo ===================================================
start cmd /k "cd frontend && npm run dev"

echo.
echo Waiting 5 seconds for server to initialize...
timeout /t 5 >nul

echo Opening browser at http://127.0.0.1:3000...
start http://127.0.0.1:3000

echo.
echo Server has been started!
echo If you want to stop it, run stop_servers.bat.
pause
