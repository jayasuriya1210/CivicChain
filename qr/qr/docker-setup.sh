#!/bin/bash
# Docker setup for QR Voting System

# Build the Docker image
docker build -t qr-voting-system .

# Run the container with MongoDB
docker run -d \
  --name qr-voting-mongodb \
  -p 27017:27017 \
  mongo:latest

# Wait for MongoDB to start
sleep 5

# Run the application
docker run -d \
  --name qr-voting-app \
  --link qr-voting-mongodb:mongodb \
  -p 3001:3001 \
  -e MONGODB_URI=mongodb://mongodb:27017/voting-system \
  -e NODE_ENV=production \
  qr-voting-system

echo "✓ Docker containers started successfully"
echo "Application: http://localhost:3001"
echo ""
echo "To view logs: docker logs -f qr-voting-app"
echo "To stop: docker stop qr-voting-app qr-voting-mongodb"
