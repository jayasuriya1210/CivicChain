# All Commands Reference - Mini Voting System

## 🎯 ONE-TIME SETUP

### Run Setup Script (Recommended - Easiest)

**Windows**:
```powershell
cd "c:\Users\Shreenithi\OneDrive\Documents\mini voting"
.\setup.bat
```

**Mac/Linux**:
```bash
cd ~/OneDrive/Documents/mini\ voting
bash setup.sh
```

This installs everything automatically!

---

## 🚀 TERMINAL-BY-TERMINAL COMMANDS

### TERMINAL 1: Ganache (Blockchain Network)

```powershell
# Start Ganache on port 7545
ganache-cli -h 127.0.0.1 -p 7545 --network-id 5777 --deterministic

# Alternative port (if 7545 is busy)
ganache-cli -h 127.0.0.1 -p 8545 --network-id 5777

# Alternative with specific number of accounts
ganache-cli -a 20 -h 127.0.0.1 -p 7545 --network-id 5777

# Save accounts to file
ganache-cli -h 127.0.0.1 -p 7545 --network-id 5777 > ganache-accounts.txt
```

**Expected Output**:
```
Ganache CLI v7.x.x
...
Available Accounts
==================
(0) 0x1234567890... (100 ETH)
(1) 0x0987654321... (100 ETH)
...
Listening on 127.0.0.1:7545
```

Keep this terminal open! Don't close it.

---

### TERMINAL 2: Deploy Smart Contract

```powershell
# Navigate to blockchain folder
cd "c:\Users\Shreenithi\OneDrive\Documents\mini voting\blockchain"

# First time only - Install dependencies
npm install

# Compile the smart contract
truffle compile

# Verify compilation
truffle compile --all

# Deploy contract to Ganache
truffle migrate --network ganache

# Deploy with specific reset
truffle migrate --network ganache --reset

# Deploy specific migration
truffle migrate --network ganache --f 1 --to 1

# Check compilation
truffle networks

# View deployed contracts
cat build/contracts/Voting.json
```

**Expected Output**:
```
Compiling your contracts...
===========================
...
Deploying 'Voting'
==================
   Deploying: Voting
   ... (transaction hash) ...
   Deployed to: 0x1234567890abcdef1234567890abcdef12345678

   Saving artifacts
   ================
   ... (successful)
```

**Note**: You can close this terminal after deployment, but it's useful to keep for reference.

---

### TERMINAL 3: Backend Server

```powershell
# Navigate to backend folder
cd "c:\Users\Shreenithi\OneDrive\Documents\mini voting\backend"

# First time only - Install dependencies
npm install

# Start backend server
npm start

# Alternative: start with specific port
set PORT=5000 && npm start

# Development mode with hot reload (requires nodemon)
npm install --save-dev nodemon
npm run dev

# Check if npm start command exists
cat package.json | findstr "start"
```

**Expected Output**:
```
🚀 Server is running on http://localhost:5000
📊 Backend ready for voting system
```

Keep this terminal open!

---

### TERMINAL 4: Face Recognition Service (Python)

```powershell
# Navigate to face_model folder
cd "c:\Users\Shreenithi\OneDrive\Documents\mini voting\backend\face_model"

# Create virtual environment (one time)
python -m venv venv

# Activate virtual environment (EVERY TIME)
.\venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Check if model files are accessible
dir "c:\Users\Shreenithi\Decentralized-Voting-System\face_recognition\"

# Run face verification service
python face_verify.py

# Alternative: with custom port
set FLASK_PORT=5001 && python face_verify.py

# Deactivate virtual environment (when done)
deactivate
```

**Expected Output**:
```
🔐 Initializing Face Verification Service...
📁 Embeddings: c:/Users/Shreenithi/Decentralized-Voting-System/...
📁 Labels: c:/Users/Shreenithi/Decentralized-Voting-System/...
✓ Embeddings loaded: (123, 456)
✓ Labels loaded: (123,)
✓ Unique voters in database: XXX
🔐 Face Verification Service Running on http://localhost:5001
```

Keep this terminal open!

---

### TERMINAL 5: Frontend Web Server

```powershell
# Navigate to frontend folder
cd "c:\Users\Shreenithi\OneDrive\Documents\mini voting\frontend"

# Option A: Python built-in server (RECOMMENDED - No installation needed)
python -m http.server 8000

# Option B: Node.js http-server
npm install -g http-server
http-server -p 8000

# Option C: Python with specific port
python -m http.server 8000 --bind 0.0.0.0

# Option D: Node.js express server (if needed)
npm install express
node -e "const express = require('express'); const app = express(); app.use(express.static('.')); app.listen(8000, () => console.log('Listening on 8000'));"
```

**Expected Output**:
```
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

Keep this terminal open!

---

## 🎮 BROWSER COMMANDS

```javascript
// Open Developer Console (F12) and run these to test

// Check if backend is running
fetch('http://localhost:5000/api/health')
  .then(r => r.json())
  .then(d => console.log('Backend:', d))

// Check if face service is running
fetch('http://localhost:5001/health')
  .then(r => r.json())
  .then(d => console.log('Face Service:', d))

// Test voter login
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    voterId: '123456789012',
    walletAddress: '0x...'
  })
})
.then(r => r.json())
.then(d => console.log('Login Response:', d))

// Get candidates
fetch('/api/vote/candidates')
  .then(r => r.json())
  .then(d => console.log('Candidates:', d))
```

---

## 🔧 UTILITY COMMANDS

### Clean Installation

```powershell
# Remove all dependencies
cd blockchain && rm -r node_modules && cd ..
cd backend && rm -r node_modules && cd ..

# Reinstall everything
cd blockchain && npm install && cd ..
cd backend && npm install && cd ..

# Clear npm cache
npm cache clean --force
```

### Check Ports in Use

```powershell
# Check specific port
netstat -ano | findstr :5000
netstat -ano | findstr :7545
netstat -ano | findstr :8000

# Kill process using port (replace PID)
taskkill /PID 12345 /F

# List all listening ports
netstat -ab
```

### Restart Services

```powershell
# Terminal 1: Stop Ganache (Ctrl+C) and restart
ganache-cli -h 127.0.0.1 -p 7545 --network-id 5777

# Terminal 3: Stop backend (Ctrl+C) and restart
cd backend && npm start

# Terminal 4: Stop face service (Ctrl+C)
# Deactivate Python
deactivate
# Reactivate and restart
.\venv\Scripts\activate
python face_verify.py

# Terminal 5: Stop frontend (Ctrl+C) and restart
cd frontend && python -m http.server 8000
```

### Database/Storage Commands

```powershell
# View uploaded face images
dir "c:\Users\Shreenithi\OneDrive\Documents\mini voting\backend\uploads\faces"

# Clear face images
rm "c:\Users\Shreenithi\OneDrive\Documents\mini voting\backend\uploads\faces\*"

# View backend logs
cat "c:\Users\Shreenithi\OneDrive\Documents\mini voting\backend\logs.txt"
```

---

## 📊 TESTING COMMANDS

### Test Voter ID Format

```javascript
// In browser console
const voterId = '123456789012';

// Validate voter ID (12 digits)
const isValid = /^\d{12}$/.test(voterId);
console.log('Valid voter ID:', isValid);
```

### Test Wallet Address

```javascript
// Check MetaMask wallet
const walletAddress = ethereum.selectedAddress;
console.log('Connected wallet:', walletAddress);

// Request account access
await ethereum.request({ method: 'eth_requestAccounts' });
```

### Test Smart Contract

```javascript
// Check contract balance
web3.eth.getBalance('0x1234567890abcdef...').then(console.log);

// Get account nonce
web3.eth.getTransactionCount('0xYourAddress').then(console.log);
```

---

## 🔒 Admin Commands

### Change Admin Password

In `backend/.env`:
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_new_password_here
```

Then restart backend (Terminal 3).

### Reset Voting System

From Terminal 2:
```powershell
# Reset smart contract
cd blockchain
truffle migrate --network ganache --reset
```

This clears all votes but keeps the contract structure.

---

## 📝 Useful PowerShell Commands

```powershell
# Create new terminal tab (Windows Terminal)
# Ctrl + Shift + T

# Split terminal screen (Windows Terminal)
# Alt + Shift + D (vertical) or Alt + Shift + - (horizontal)

# Clear screen
Clear-Host

# Go back to previous folder
cd -

# List files
ls
dir
Get-ChildItem

# Create new folder
mkdir foldername
New-Item -ItemType Directory -Path ".\foldername"

# Find files
Get-ChildItem -Recurse -Filter "*.js"
```

---

## 🚨 Emergency Commands

### If Port is Stuck

```powershell
# Find process on port
netstat -ano | findstr ":5000"
netstat -ano | findstr ":7545"
netstat -ano | findstr ":8000"

# Kill the process (replace PID)
taskkill /PID 1234 /F
taskkill /IM node.exe /F      (Kill all node processes)
taskkill /IM python.exe /F    (Kill all Python processes)
```

### If Services Won't Start

```powershell
# Update npm
npm install -g npm@latest

# Clear npm cache
npm cache clean --force

# Reinstall Node.js
# Download from https://nodejs.org/

# For Python, reinstall dependencies
cd backend\face_model
rm -r venv
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Full System Reset

```powershell
# 1. Stop all terminals (Ctrl+C in each)

# 2. Clean installations
cd "c:\Users\Shreenithi\OneDrive\Documents\mini voting"
rm blockchain\build
rm blockchain\node_modules
rm backend\node_modules
rm backend\face_model\venv

# 3. Reinstall everything
.\setup.bat

# 4. Start all terminals again
```

---

## 📚 File Access Commands

```powershell
# View smart contract
cat blockchain\contracts\Voting.sol

# View backend server code
cat backend\server.js

# View routes
cat backend\routes\auth.js
cat backend\routes\face.js
cat backend\routes\vote.js
cat backend\routes\admin.js

# View frontend pages
cat frontend\index.html
cat frontend\face.html
cat frontend\vote.html
cat frontend\admin.html
cat frontend\result.html

# View configuration
cat backend\.env
cat blockchain\truffle-config.js

# View documentation
cat README.md
cat QUICK_START.md
cat PROJECT_SUMMARY.md
```

---

## ✅ VERIFICATION COMMANDS

### Verify Installation

```powershell
# Check Node.js
node --version
npm --version

# Check Truffle
truffle --version

# Check Ganache
ganache-cli --version

# Check Python
python --version
pip --version

# List global npm packages
npm list -g
```

### Verify Services Running

```powershell
# From separate terminal, test each service

# Test Ganache
curl http://127.0.0.1:7545

# Test Backend
curl http://localhost:5000/api/health

# Test Face Service
curl http://localhost:5001/health

# Test Frontend
curl http://localhost:8000
```

---

## 🎓 COMPLETE WORKFLOW

**First Time Setup**:
```powershell
1. .\setup.bat                                    # Install everything

Open 5 terminals and run:
2. Terminal 1: ganache-cli -h 127.0.0.1 -p 7545  # Blockchain
3. Terminal 2: cd blockchain && truffle migrate   # Deploy contract
4. Terminal 3: cd backend && npm start             # Backend server
5. Terminal 4: cd backend\face_model && python... # Face service
6. Terminal 5: cd frontend && python -m http.server 8000

7. Open Browser: http://localhost:8000            # Access system
```

**Subsequent Uses**:
```powershell
Just repeat steps 2-7 (setup.bat not needed again)
```

---

## 🎯 Quick Reference Table

| What | Command | Terminal | Time |
|------|---------|----------|------|
| Setup | `.\setup.bat` | Any | 2-3 min |
| Ganache | `ganache-cli -h 127.0.0.1 -p 7545...` | 1 | 10 sec |
| Deploy | `cd blockchain && truffle migrate --network ganache` | 2 | 20 sec |
| Backend | `cd backend && npm start` | 3 | 5 sec |
| Face | `cd backend\face_model && python face_verify.py` | 4 | 15 sec |
| Frontend | `cd frontend && python -m http.server 8000` | 5 | 3 sec |
| Access | Open http://localhost:8000 | Browser | instant |

---

**Save this file for quick reference when setting up and managing the system!** 📝

Happy Voting! 🗳️
