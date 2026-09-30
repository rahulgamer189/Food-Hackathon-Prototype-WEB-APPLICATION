@echo off
setlocal
cd /d "%~dp0"

echo Installing dependencies...
npm install
if errorlevel 1 (
  echo.
  echo npm install failed. Check that Node.js 20+ is installed, then try again.
  pause
  exit /b 1
)

echo.
echo Starting Food4iFe Campus at http://localhost:3000/
echo Press Ctrl+C to stop the server.
npm run dev
pause
