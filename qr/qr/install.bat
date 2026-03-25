@echo off
REM Installation and Setup Script for QR Voting System (Windows)

echo ===============================================
echo QR Code Based Voting Authentication System
echo Installation Script (Windows)
echo ===============================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

for /f "delims=" %%i in ('node -v') do set NODE_VERSION=%%i
for /f "delims=" %%i in ('npm -v') do set NPM_VERSION=%%i

echo ✓ Node.js version: %NODE_VERSION%
echo ✓ NPM version: %NPM_VERSION%
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✓ Dependencies installed successfully
echo.

REM Create .env file from example
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env >nul
    echo ✓ .env file created. Please edit it with your configuration.
) else (
    echo ✓ .env file already exists
)

echo.
echo ===============================================
echo Setup Complete!
echo ===============================================
echo.
echo Next steps:
echo 1. Edit .env file with your configuration
echo 2. Start MongoDB server
echo 3. Run 'npm start' to start the server
echo 4. (Optional) Run 'npm run seed' to add sample voters
echo.
echo Server will run on: http://localhost:3001
echo Admin Dashboard: http://localhost:3001/admin/dashboard
echo Booth Scanner: http://localhost:3001/booth/scanner
echo.

pause
