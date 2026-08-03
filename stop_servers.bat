@echo off
echo Finding and killing processes listening on port 3000 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a
)

echo.
echo Server stopped successfully!
pause
