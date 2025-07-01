@echo off
echo 🚀 Payment Gateway Local Runner
echo ==============================

echo.
echo Checking if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js is installed
echo.

echo Checking if npm is available...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not available. Please install npm.
    pause
    exit /b 1
)

echo ✅ npm is available
echo.

echo Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed
echo.

echo Starting backend server...
start "Backend Server" cmd /k "node backend/server.js"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo Starting frontend development server...
start "Frontend Server" cmd /k "npm run dev:frontend"

echo.
echo 🎉 Payment Gateway is starting!
echo.
echo 📱 Frontend will be available at: http://localhost:5173
echo 🔌 Backend API will be available at: http://localhost:3001
echo 🏥 Health check: http://localhost:3001/health
echo.
echo Press any key to open the application in your browser...
pause >nul

start http://localhost:5173

echo.
echo ✅ Application started successfully!
echo.
echo To stop the servers:
echo 1. Close the command windows that opened
echo 2. Or press Ctrl+C in each window
echo.
pause 