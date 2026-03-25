@echo off
REM Mini Voting System - Windows Setup Script

echo.
echo ======================================
echo  Mini Voting System - Setup Script
echo ======================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found. Please install from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js installed

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm not found
    pause
    exit /b 1
)
echo [OK] npm installed

REM Check Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python not found. Please install from https://python.org/
    pause
    exit /b 1
)
echo [OK] Python installed

echo.
echo Checking and installing global packages...

REM Install Truffle globally
npm list -g truffle >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Installing Truffle...
    call npm install -g truffle
)
echo [OK] Truffle ready

REM Install Ganache globally
npm list -g ganache-cli >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Installing Ganache...
    call npm install -g ganache-cli
)
echo [OK] Ganache CLI ready

echo.
echo Installing project dependencies...
echo.

REM Install blockchain dependencies
echo [1/3] Installing blockchain dependencies...
cd blockchain
call npm install
cd ..

REM Install backend dependencies
echo [2/3] Installing backend dependencies...
cd backend
call npm install
cd ..

REM Install Python dependencies
echo [3/3] Installing Python dependencies...
cd backend\face_model
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
call venv\Scripts\deactivate
cd ..\..

echo.
echo ======================================
echo SUCCESS! Installation Complete
echo ======================================
echo.
echo NEXT STEPS - Run these in separate terminals:
echo.
echo Terminal 1 - Ganache (Blockchain Network)
echo   ganache-cli -h 127.0.0.1 -p 7545 --network-id 5777
echo.
echo Terminal 2 - Deploy Contract
echo   cd blockchain
echo   truffle migrate --network ganache
echo.
echo Terminal 3 - Backend Server
echo   cd backend
echo   npm start
echo.
echo Terminal 4 - Face Recognition Service
echo   cd backend\face_model
echo   python face_verify.py
echo.
echo Terminal 5 - Frontend Server
echo   cd frontend
echo   python -m http.server 8000
echo.
echo Then visit: http://localhost:8000
echo.
pause
