#!/bin/bash
# Quick setup script for Mini Voting System

echo "🗳️  Mini Voting System - Setup Script"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Checking Prerequisites...${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js not found. Please install from https://nodejs.org/${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js: $(node --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}⚠️  npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm: $(npm --version)${NC}"

# Check Python
if ! command -v python &> /dev/null; then
    echo -e "${YELLOW}⚠️  Python not found. Please install from https://python.org/${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python: $(python --version)${NC}"

echo ""
echo -e "${BLUE}📦 Installing Dependencies...${NC}"
echo ""

# Install blockchain dependencies
echo "📦 Installing Blockchain dependencies..."
cd blockchain
npm install
cd ..

# Install backend dependencies
echo "📦 Installing Backend dependencies..."
cd backend
npm install
cd ..

# Install Python dependencies
echo "📦 Installing Python dependencies..."
cd backend/face_model
python -m venv venv
if [ -d "venv" ]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi
pip install -r requirements.txt
deactivate
cd ../..

echo ""
echo -e "${GREEN}✅ Installation Complete!${NC}"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo ""
echo "1. Start Ganache (Terminal 1):"
echo "   ganache-cli -h 127.0.0.1 -p 7545 --network-id 5777"
echo ""
echo "2. Deploy Contract (Terminal 2):"
echo "   cd blockchain"
echo "   truffle migrate --network ganache"
echo ""
echo "3. Start Backend (Terminal 3):"
echo "   cd backend"
echo "   npm start"
echo ""
echo "4. Start Face Service (Terminal 4):"
echo "   cd backend/face_model"
echo "   python face_verify.py"
echo ""
echo "5. Start Frontend (Terminal 5):"
echo "   cd frontend"
echo "   python -m http.server 8000"
echo ""
echo "Then visit: http://localhost:8000"
