# QR Authentication System - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Production Deployment](#production-deployment)
4. [Docker Deployment](#docker-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- **Node.js** v16.0.0 or higher
- **npm** v8.0.0 or higher
- **MongoDB** v5.0 or higher
- **Git** (for version control)

### Optional Software
- **Docker** & **Docker Compose** (for containerized deployment)
- **PM2** (for process management in production)
- **Nginx** (for reverse proxy)

## Local Development Setup

### 1. Clone or Setup Project

```bash
cd /path/to/project
```

### 2. Install Dependencies

```bash
npm install
```

Or use the automated install script:

**Windows:**
```bash
install.bat
```

**Linux/Mac:**
```bash
chmod +x install.sh
./install.sh
```

### 3. Configure Environment Variables

```bash
# Create .env file from template
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

Edit the `.env` file with these critical settings:

```env
# Must change for development
JWT_SECRET=my-development-jwt-secret-key-min-32-characters
VOTING_SECRET=my-development-voting-secret-key-min-32-characters
SESSION_SECRET=my-development-session-secret-key

# MongoDB connection
MONGODB_URI=mongodb://localhost:27017/voting-system

# Server
BASE_URL=http://localhost:3001
PORT=3001
NODE_ENV=development
```

### 4. Start MongoDB

**Windows:**
```bash
# Start MongoDB service (if installed)
net start MongoDB

# Or run MongoDB directly
mongod --dbpath "C:\\data\\db"
```

**Linux/Mac:**
```bash
# Using Homebrew (Mac)
brew services start mongodb-community

# Or manually
mongod
```

**Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 5. Seed Sample Data (Optional)

```bash
npm run seed
```

This will add 10 sample voters to the database for testing.

### 6. Start Development Server

```bash
# Simple start
npm start

# With auto-reload (requires nodemon)
npm run dev
```

The application will be available at: **http://localhost:3001**

### 7. Access the Application

- **Main Page:** http://localhost:3001
- **Admin Login:** http://localhost:3001/admin/login
- **Booth Scanner:** http://localhost:3001/booth/scanner
- **Admin Dashboard:** http://localhost:3001/admin/dashboard

**Test Credentials:**
- Username: `admin`
- Password: `admin123`

## Production Deployment

### Pre-Deployment Checklist

- [ ] Changed all JWT secrets in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Configured MongoDB with authentication
- [ ] Set up SSL/TLS certificates
- [ ] Configured CORS properly
- [ ] Tested all API endpoints
- [ ] Backed up database
- [ ] Reviewed security settings

### Option 1: Direct Node.js Deployment

```bash
# 1. Install dependencies (production only)
npm ci --only=production

# 2. Update .env for production
nano .env

# 3. Start with PM2
npm install -g pm2
pm2 start qr-auth-server.js --name "qr-voting-system"
pm2 startup
pm2 save
```

Monitor the application:
```bash
pm2 logs qr-voting-system
pm2 monit
```

### Option 2: Using Nginx as Reverse Proxy

**Nginx Configuration** (`/etc/nginx/sites-available/qr-voting`):

```nginx
upstream qr_voting {
  server 127.0.0.1:3001;
  keepalive 64;
}

server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  
  server_name your-domain.com;

  # SSL certificates
  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;

  # Security headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "SAMEORIGIN" always;

  location / {
    proxy_pass http://qr_voting;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    
    # WebSocket support
    proxy_read_timeout 86400;
  }

  location /socket.io {
    proxy_pass http://qr_voting;
    proxy_http_version 1.1;
    proxy_buffering off;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}

# HTTP to HTTPS redirect
server {
  listen 80;
  listen [::]:80;
  server_name your-domain.com;
  
  return 301 https://$server_name$request_uri;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/qr-voting /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 3: Cloud Platforms

#### Heroku Deployment

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Add MongoDB Atlas (or Heroku Postgres)
heroku addons:create mongolab

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

#### AWS EC2 Deployment

```bash
# 1. Launch EC2 instance (Ubuntu 20.04 LTS)
# 2. Connect via SSH
ssh -i your-key.pem ubuntu@your-instance-ip

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Install MongoDB
sudo apt-get install mongodb

# 5. Clone project
git clone your-repo.git
cd qr

# 6. Install dependencies
npm install

# 7. Configure .env
nano .env

# 8. Start with PM2
npm install -g pm2
pm2 start qr-auth-server.js
pm2 startup
pm2 save
```

## Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove data
docker-compose down -v
```

This will start:
- MongoDB container on port 27017
- Node.js application on port 3001

### Manual Docker Setup

```bash
# 1. Build image
docker build -t qr-voting-system .

# 2. Run MongoDB
docker run -d \
  --name voting-db \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:latest

# 3. Run app
docker run -d \
  --name voting-app \
  --link voting-db:mongodb \
  -p 3001:3001 \
  -e MONGODB_URI=mongodb://mongodb:27017/voting-system \
  -e NODE_ENV=production \
  qr-voting-system

# 4. View logs
docker logs -f voting-app
```

### Docker Production Best Practices

- Use specific image versions (not `latest`)
- Implement health checks
- Use environment variables for sensitive data
- Run as non-root user
- Set resource limits

## Environment Configuration

### Critical Security Variables

```env
# JWT Configuration (MUST CHANGE)
JWT_SECRET=minimum-32-character-random-string-for-production
VOTING_SECRET=minimum-32-character-random-string-for-production
SESSION_SECRET=minimum-32-character-random-string-for-production

# Database
MONGODB_URI=mongodb://user:password@host:port/voting-system

# Server
NODE_ENV=production
PORT=3001
BASE_URL=https://your-domain.com

# CORS - Restrict to your domain
CORS_ORIGIN=https://your-domain.com

# Token Expiry
TOKEN_EXPIRY=24h
VOTING_TOKEN_EXPIRY=10m
```

### Generate Strong Secrets

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Monitoring & Maintenance

### Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-02-23T10:30:00Z",
  "mongodb": "connected"
}
```

### Database Backup

```bash
# Backup MongoDB
mongodump --uri "mongodb://user:pass@host:27017/voting-system" --out ./backup

# Restore MongoDB
mongorestore --uri "mongodb://user:pass@host:27017/voting-system" ./backup
```

### Log Rotation

Configure PM2 logs:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 10
```

## Troubleshooting

### Issue: MongoDB Connection Failed

```bash
# Check if MongoDB is running
ps aux | grep mongod

# Check connection URI
# Ensure MongoDB credentials are correct in .env
# Verify network connectivity to MongoDB host
```

### Issue: Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3002 npm start
```

### Issue: WebSocket Connection Failed

- Check CORS settings
- Verify Socket.io is enabled
- Check firewall rules
- Ensure base URL matches in client and server

### Issue: Certificate/SSL Error

```bash
# Generate self-signed certificate for testing
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /path/to/key.pem -out /path/to/cert.pem

# Update Nginx configuration with certificate paths
```

### Issue: High Memory Usage

```bash
# Monitor with PM2
pm2 monit

# Check for memory leaks
# Restart application periodically
pm2 restart qr-voting-system
```

## Performance Optimization

1. **Enable Compression:**
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

2. **Database Indexing:**
   ```javascript
   // Add indexes to frequently queried fields
   db.voters.createIndex({ voterId: 1 });
   db.sessions.createIndex({ status: 1 });
   ```

3. **Caching:**
   - Implement Redis for session caching
   - Cache static assets

4. **Rate Limiting:**
   ```javascript
   const rateLimit = require('express-rate-limit');
   app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
   ```

## Security Best Practices

1. ✓ Use HTTPS in production
2. ✓ Keep dependencies updated: `npm audit fix`
3. ✓ Rotate secrets regularly
4. ✓ Enable database authentication
5. ✓ Implement rate limiting
6. ✓ Use security headers
7. ✓ Validate all inputs
8. ✓ Log security events
9. ✓ Monitor for vulnerabilities
10. ✓ Regular backups

## Support & Assistance

For issues or questions:
- Check logs: `pm2 logs` or `docker logs`
- Review API documentation: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- Check MongoDB connection
- Verify environment variables
- Clear browser cache and cookies

---

**Last Updated:** February 2024  
**Version:** 1.0.0
