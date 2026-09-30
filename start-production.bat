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

echo Building Food4iFe Campus...
npm run build
if errorlevel 1 (
  echo.
  echo The production build failed. Read the error above.
  pause
  exit /b 1
)

echo.
echo Starting production server at http://localhost:3000/
echo Press Ctrl+C to stop the server.
npm start
pause
