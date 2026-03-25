#!/bin/bash
# Installation and Setup Script for QR Voting System

echo "==============================================="
echo "QR Code Based Voting Authentication System"
echo "Installation Script"
echo "==============================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✓ Node.js version: $(node -v)"
echo "✓ NPM version: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed successfully"
echo ""

# Create .env file from example
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env file created. Please edit it with your configuration."
else
    echo "✓ .env file already exists"
fi

echo ""
echo "==============================================="
echo "Setup Complete!"
echo "==============================================="
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Start MongoDB server"
echo "3. Run 'npm start' to start the server"
echo "4. (Optional) Run 'npm run seed' to add sample voters"
echo ""
echo "Server will run on: http://localhost:3001"
echo "Admin Dashboard: http://localhost:3001/admin/dashboard"
echo "Booth Scanner: http://localhost:3001/booth/scanner"
echo ""
