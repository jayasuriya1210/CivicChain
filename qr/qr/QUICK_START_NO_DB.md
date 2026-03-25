# Quick Start Guide - QR Code Voting Authentication System

## ⚡ Run Without Database (Fastest Way)

This application can now run **without MongoDB** using in-memory storage. Perfect for development, testing, and demos.

### Option 1: Automatic Fallback (Recommended)

The system will **automatically** switch to in-memory storage if MongoDB is not available:

```bash
# Simply install dependencies and start
npm install
npm start
```

**What happens:**
- ✅ Server starts immediately
- ✅ No MongoDB required
- ✅ Data stored in-memory
- ⚠️ Data is lost when server restarts

### Option 2: Force In-Memory Mode

To explicitly use in-memory storage:

1. Create `.env` file in the project root:
```bash
USE_MEMORY_DB=true
PORT=3000
NODE_ENV=development
```

2. Start the server:
```bash
npm start
```

### Option 3: Use MongoDB (Production)

If you want persistent data storage:

#### Setup MongoDB Locally:
- **Windows**: Download from https://www.mongodb.com/try/download/community
- **Mac**: `brew install mongodb-community`
- **Linux**: `sudo apt-get install mongodb`

#### Setup MongoDB Atlas (Cloud):
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account and cluster
3. Get connection string
4. Set in `.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/voting-system
```

5. Start server:
```bash
npm start
```

## 📊 Check System Status

```bash
curl http://localhost:3000/health
```

**Response with In-Memory DB:**
```json
{
  "status": "OK",
  "database": "In-Memory",
  "mode": "Development (No persistence)"
}
```

**Response with MongoDB:**
```json
{
  "status": "OK",
  "database": "MongoDB",
  "mode": "Production (MongoDB)"
}
```

## 🧪 Test the API

### Register a Voter
```bash
curl -X POST http://localhost:3000/voter/register \
  -H "Content-Type: application/json" \
  -d '{
    "voterId": "V001",
    "name": "John Doe",
    "phone": "9876543210",
    "email": "john@example.com",
    "photoUrl": "https://example.com/photo.jpg",
    "constituency": "New York",
    "boothId": "BOOTH001"
  }'
```

### Get Voter Details
```bash
curl http://localhost:3000/voter/V001
```

### Get Health Status
```bash
curl http://localhost:3000/health
```

## 📁 Key Files Modified for In-Memory Support

- `models/in-memory-db.js` - In-memory database implementation
- `models/db-connection.js` - Database connection with fallback
- `models/Voter.js` - Wrapper for both DB types
- `models/VoteRecord.js` - Wrapper for both DB types
- `models/VerificationSession.js` - Wrapper for both DB types
- `qr-auth-server.js` - Updated server with fallback logic
- `config/config.js` - Added in-memory configuration option

## 💾 Data Persistence

| Mode | Persistence | Restart Data | Best For |
|------|------------|--------------|----------|
| **In-Memory** | ❌ No | ❌ Lost | Development, Testing, Demos |
| **MongoDB Local** | ✅ Yes | ✅ Preserved | Local Development |
| **MongoDB Atlas** | ✅ Yes | ✅ Preserved | Production |

## 🔄 Switching Between Modes

**From MongoDB to In-Memory:**
```bash
# Edit .env
USE_MEMORY_DB=true
# Restart server
npm start
```

**From In-Memory to MongoDB:**
```bash
# Edit .env
USE_MEMORY_DB=false
MONGODB_URI=mongodb://localhost:27017/voting-system
# Make sure MongoDB is running
# Restart server
npm start
```

## ⚠️ Limitations of In-Memory Mode

1. **No persistence** - Data lost on restart
2. **Single instance** - Not suitable for multi-process
3. **Memory usage** - Limited by available RAM
4. **No backup** - No data recovery options

## 📝 Notes

- The system **automatically chooses the best mode**:
  1. If `USE_MEMORY_DB=true` is set → Use In-Memory
  2. If MongoDB is reachable → Use MongoDB
  3. If MongoDB fails → Fallback to In-Memory

- All API endpoints work identically in both modes
- Socket.io real-time features work in both modes
- Data structures are identical, enabling easy migration

## 🚀 Next Steps

1. Start the server with `npm start`
2. Visit http://localhost:3000/health to confirm it's running
3. Register voters and test the voting flow
4. Check the console for logs showing which database mode is active

Enjoy! 🎉
