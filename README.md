# CivicChain - Decentralized Voting with Face Verification

A complete decentralized voting system using blockchain (Ethereum) and face recognition for voter authentication. Built for Indian election system with multi-factor authentication.

## 🎯 Features

- ✅ **Decentralized Voting**: Smart contract-based voting on blockchain
- ✅ **Face Recognition**: AI-powered voter authentication
- ✅ **12-Digit Voter ID**: Standard Indian voter ID format
- ✅ **Multi-Factor Authentication**: Voter ID + Face verification
- ✅ **Real-time Results**: Live vote counting and results
- ✅ **Admin Panel**: Candidate management, voting schedule, results
- ✅ **MetaMask Integration**: Ethereum wallet integration
- ✅ **Responsive UI**: Mobile-friendly interface

## 📁 Project Structure

```
CivicChain/
├── blockchain/
│   ├── contracts/
│   │   └── Voting.sol
│   ├── migrations/
│   │   └── 1_deploy_contract.js
│   ├── test/
│   ├── build/
│   └── truffle-config.js
│
├── backend/
│   ├── routes/
│   │   ├── auth.js           (Voter authentication)
│   │   ├── face.js           (Face verification API)
│   │   ├── vote.js           (Voting operations)
│   │   └── admin.js          (Admin operations)
│   ├── models/
│   │   ├── Voter.js
│   │   └── Candidate.js
│   ├── face_model/
│   │   ├── face_verify.py    (Face verification logic)
│   │   ├── known_embeddings.npy  (Your trained model)
│   │   ├── known_labels.npy      (Voter labels)
│   │   └── requirements.txt
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── index.html            (Voter login)
│   ├── face.html             (Face verification)
│   ├── vote.html             (Voting page)
│   ├── admin.html            (Admin panel)
│   ├── result.html           (Results display)
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
│
└── README.md
```

## 🚀 Quick Start Setup

### Prerequisites
- Node.js v14+ and npm
- Python 3.8+
- Ganache CLI (blockchain local network)
- MetaMask (Ethereum wallet extension)
- Truffle (Smart contract compiler)

### Step 1: Install Required Software

#### Windows PowerShell Commands:

```powershell
# 1. Install Node.js packages globally
npm install -g truffle ganache-cli

# 2. Check installations
node --version
npm --version
ganache-cli --version
truffle --version
```

### Step 2: Setup Ganache (Local Blockchain)

Open **Terminal 1** - Ganache Network:

```powershell
# Start Ganache on port 7545 (or run the helper to free port first)
# manually kill previous instances with taskkill or use the script below
# which cleans port 7545 before launching Ganache.
#
# PowerShell helper included at project root:
#   .\start_ganache.ps1

ganache-cli -h 127.0.0.1 -p 7545 --network-id 5777 --deterministic
```
**Note**: Keep this terminal open. It shows:
- 10 test accounts
- Private keys
- Network status

### Step 3: Deploy Smart Contract

Open **Terminal 2** - Blockchain Deployment:

```powershell
# Navigate to blockchain folder
cd /path/to/CivicChain/blockchain

# Install Truffle dependencies
npm install

# Compile the smart contract
truffle compile

# Deploy to Ganache
truffle migrate --network ganache

# Note the contract address from deployment output
# Example: Deployed Voting at 0x1234567890123456789012345678901234567890
```

### Step 4: Setup Backend (Node.js)

Open **Terminal 3** - Backend Server:

```powershell
# Navigate to backend folder
cd /path/to/CivicChain/backend

# Install Node.js dependencies
npm install

# Run the backend server
npm start
# Or for development with auto-reload:
npm run dev
```

**Backend runs on**: http://localhost:5000

### Step 5: Setup Face Recognition Service

Open **Terminal 4** - Python Face Service:

```powershell
# Navigate to face_model folder
cd /path/to/CivicChain/backend/face_model

# Create Python virtual environment (recommended)
python -m venv venv
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Run face verification service
python face_verify.py
```

**Face Service runs on**: http://localhost:5001

### Step 6: Start Frontend

Open **Terminal 5** - Frontend (Simple HTTP Server):

```powershell
# Navigate to frontend folder
cd /path/to/CivicChain/frontend

# Option A: Python built-in server
python -m http.server 8000

# Option B: Node.js http-server (install first: npm install -g http-server)
http-server -p 8000

# Option C: Using Node.js
node -e "require('http').createServer((req, res) => require('fs').readFile('.'+req.url, (e,d) => res.end(d||'404')), {}).listen(8000)"
```

**Frontend runs on**: http://localhost:8000

## 🔧 Terminal Summary

| Terminal | Command | Port | Purpose |
|----------|---------|------|---------|
| Terminal 1 | `ganache-cli -h 127.0.0.1 -p 7545` | 7545 | Blockchain Network |
| Terminal 2 | `truffle migrate --network ganache` | - | Deploy Smart Contract |
| Terminal 3 | `npm start` (from backend) | 5000 | Backend Server |
| Terminal 4 | `python face_verify.py` | 5001 | Face Recognition |
| Terminal 5 | `python -m http.server 8000` | 8000 | Frontend Web Server |

## 🔐 Default Credentials

### Voter Login
- **Voter ID**: Any 12-digit number (e.g., `123456789012`)
- **Wallet Address**: Your MetaMask wallet address (0x...)

### Admin Login
- **Username**: `admin`
- **Password**: `admin@123`
- **Access URL**: http://localhost:8000/admin.html

## 📋 How to Use

### For Voters:

1. **Go to Voter Login** → http://localhost:8000
2. **Enter 12-digit Voter ID** (e.g., 123456789012)
3. **Enter your MetaMask wallet address**
4. **Click "Login"**
5. **Face Verification**:
   - Click "Start Camera"
   - Click "Capture Photo"
   - Click "Verify Face"
6. **Vote**:
   - See list of candidates
   - Click to select candidate
   - Click "Cast Your Vote"
7. **View Results**: See live election results

### For Admin:

1. **Go to Admin Panel** → http://localhost:8000/admin.html
2. **Login** with `admin` / `admin@123`
3. **Dashboard Features**:
   - **Add Candidate**: Add candidates with party name and symbol
   - **Voting Schedule**: Set election dates and times
   - **View Results**: See live voting results
   - **Settings**: Change password

## 🤖 Face Recognition Model Integration

Your trained models are automatically used:

```
known_embeddings.npy  ← Your trained face embeddings
known_labels.npy      ← Corresponding voter labels
```

These files should be placed at:
```
backend/face_model/
├── known_embeddings.npy
└── known_labels.npy
```

The system will automatically load and use them for verification.

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - Register voter
- `POST /api/auth/login` - Login voter
- `GET /api/auth/voter-info` - Get voter info
- `POST /api/auth/logout` - Logout

### Face Verification
- `POST /api/face/verify` - Verify face image
- `GET /api/face/status` - Get verification status

### Voting
- `GET /api/vote/candidates` - Get all candidates
- `POST /api/vote/cast-vote` - Cast vote
- `GET /api/vote/results` - Get live results
- `GET /api/vote/voter-status` - Get voter voting status

### Admin
- `POST /api/admin/login` - Admin login
- `POST /api/admin/add-candidate` - Add candidate
- `POST /api/admin/set-voting-schedule` - Set schedule
- `GET /api/admin/results` - Get results
- `POST /api/admin/end-voting` - End voting
- `POST /api/admin/reset-voting` - Reset voting
- `GET /api/admin/statistics` - Get statistics

## 🛠️ Configuration

### Backend Configuration (backend/.env)

```env
PORT=5000
JWT_SECRET=civicchain_secret_key_change_in_production_2024
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin@123
GANACHE_HOST=127.0.0.1
GANACHE_PORT=7545
GANACHE_NETWORK_ID=5777
WEB3_PROVIDER=http://localhost:7545
FACE_SERVICE_URL=http://localhost:5001
```

## 📱 Smart Contract Details

### Voting.sol Features:

1. **Voter Management**:
   - Register voters with ID
   - Track verification status
   - Prevent double voting

2. **Candidate Management**:
   - Add candidates by admin
   - Store party information
   - Maintain vote counts

3. **Voting Operations**:
   - Cast votes securely
   - Verify voter eligibility
   - Record on blockchain

4. **Result Management**:
   - Real-time vote counting
   - Winner determination
   - Result transparency

## 🐛 Troubleshooting

### Issue: "Cannot find module" errors

```powershell
# In backend folder
rm -r node_modules
npm install
```

### Issue: Face verification service not responding

```powershell
# Make sure Python requirements are installed
pip install -r backend/face_model/requirements.txt

# Restart the face service in Terminal 4
```

### Issue: Ganache connection error

```powershell
# Check Ganache is running in Terminal 1
# Ensure port 7545 is not blocked
# Restart Ganache
```

### Issue: MetaMask not connecting

1. Open MetaMask extension
2. Click Network selector (top-left)
3. Click "Add Network"
4. Configure:
   - Network name: `Ganache Local`
   - RPC URL: `http://127.0.0.1:7545`
   - Chain ID: `5777`
   - Currency: `ETH`
5. Save and select this network

## 📊 Testing the System

### Test Voter IDs
```
123456789012
123456789013
987654321098
111222333444
```

### Test Admin Features
1. Login to admin panel
2. Add 3-4 test candidates
3. Set voting dates (future times)
4. Create some test votes in voter panel
5. Check results in admin panel

## 🔒 Security Notes

1. **Change default credentials** in production
2. **Update JWT_SECRET** in .env
3. **Use HTTPS** in production
4. **Implement database** instead of in-memory storage
5. **Add input validation** for production
6. **Enable CORS** only for trusted domains

## 📦 Dependencies

### Backend (Node.js)
- express - Web framework
- web3 - Ethereum interaction
- cors - Cross-origin requests
- jsonwebtoken - JWT authentication
- bcryptjs - Password hashing
- multer - File uploads

### Face Recognition (Python)
- opencv-python - Computer vision
- numpy - Numerical computing
- scikit-learn - Machine learning
- Flask - Python web framework
- Pillow - Image processing

## 🚀 Deployment

### For Development
Use the local setup above with Ganache.

### For Testnet (Goerli/Sepolia)
1. Get test ETH from faucet
2. Update truffle-config.js with testnet RPC
3. Deploy: `truffle migrate --network goerli`
4. Update backend WEB3_PROVIDER

### For Mainnet
1. Deploy contract on Ethereum mainnet
2. Setup production database
3. Enable HTTPS
4. Update environment variables
5. Use secure admin credentials

## 📚 Further Reading

- [Truffle Documentation](https://trufflesuite.com/docs/truffle/)
- [Web3.js Documentation](https://web3js.readthedocs.io/)
- [OpenCV Documentation](https://docs.opencv.org/)
- [Express.js Documentation](https://expressjs.com/)

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review terminal error messages
3. Check console logs (F12 in browser)
4. Verify all 5 terminals are running
5. Ensure ports 5000, 5001, 7545, 8000 are available

## 📄 License

This project is for educational purposes.

## ✨ Indian Election System Compliance

This system follows Indian election standards:
- ✅ 12-digit voter ID format
- ✅ Political party symbols (BJP, INC, AIADMK, DMK, etc.)
- ✅ Voter authentication
- ✅ Secure vote casting
- ✅ Result transparency
- ✅ Admin controls

---

**Happy Voting! 🗳️**

Created for secure, transparent, and tamper-proof digital voting with CivicChain.
