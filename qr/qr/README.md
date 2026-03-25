# QR Code Based Voting Authentication System

## System Overview

A comprehensive, real-time QR code-based authentication system for securing and verifying voter identity before voting. This system implements a multi-stage verification process with admin oversight and real-time monitoring.

```
┌──────────────┐     QR Code      ┌──────────────┐    Scan     ┌──────────────┐
│   Voter      │ ───────────────► │    Polling   │ ──────────► │    Admin     │
│   (Has QR)   │                  │   Station    │             │  Dashboard   │
│              │                  │   Scanner    │             │ (Real-time)  │
└──────────────┘                  └──────────────┘             └──────┬───────┘
                                                                     │
                              ┌──────────────────────────────────────┘
                              │ Approve/Reject
                              ▼
                       ┌──────────────┐
                       │    Voter     │
                       │   Receives   │
                       │  Access Token│
                       └──────┬───────┘
                              │
                              ▼
                       ┌──────────────┐
                       │ Voting       │
                       │ Interface    │
                       │ (Unlocked)   │
                       └──────────────┘
```

## Project Structure

```
qr/
├── qr-auth-server.js          # Main authentication server
├── models/
│   ├── db-connection.js        # MongoDB connection
│   ├── Voter.js                # Voter schema
│   ├── VerificationSession.js   # Verification session schema
│   └── VoteRecord.js           # Vote record schema
├── routes/
│   ├── qr-routes.js            # QR generation endpoints
│   ├── booth-routes.js         # Booth scanning endpoints
│   ├── admin-routes.js         # Admin verification endpoints
│   └── voting-routes.js        # Vote casting endpoints
└── utils/
    ├── token-manager.js        # JWT token management
    ├── socket-events.js        # Socket.io event handlers
    └── qr-helper.js            # QR code utilities
src/
├── views/
│   ├── admin-dashboard.ejs     # Admin dashboard UI
│   └── booth-scanner.ejs       # Polling station scanner UI
└── js/
    ├── admin-dashboard.js      # Admin dashboard logic
    └── booth-scanner.js        # Scanner logic
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd contest
npm install
```

### 2. Configure Environment Variables

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
HOST=localhost
BASE_URL=http://localhost:3001

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/voting-system

# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_SECRET=your-very-secure-jwt-secret-key
VOTING_SECRET=your-very-secure-voting-secret-key

# Token Expiry
TOKEN_EXPIRY=24h                # QR code validity
VOTING_TOKEN_EXPIRY=10m         # Voting window after verification

# CORS Configuration
CORS_ORIGIN=*
```

### 3. Install and Start MongoDB

If using local MongoDB:

```bash
# Install MongoDB Community Edition
# Then start it:
mongod
```

Or use MongoDB Atlas cloud version and update `MONGODB_URI`.

### 4. Start the QR Authentication Server

```bash
node qr/qr-auth-server.js
```

Server will start at `http://localhost:3001`

## API Endpoints

### QR Code Generation

#### Generate QR Code for Voter
- **POST** `/qr/generate-qr`
- **Body:**
  ```json
  {
    "voterId": "VID2025001"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "qrCode": "data:image/png;base64,...",
    "verificationUrl": "http://localhost:3001/qr/verify/eyJ...",
    "voterId": "VID2025001",
    "expiresAt": "2025-02-22T10:30:00Z"
  }
  ```

#### Get Existing QR Code
- **GET** `/qr/get-qr/:voterId`

#### Regenerate QR Code
- **POST** `/qr/regenerate-qr/:voterId`

### Booth Scanning

#### Scan QR Code at Polling Station
- **POST** `/booth/scan-qr`
- **Body:**
  ```json
  {
    "token": "eyJ...",
    "boothId": "BOOTH-001",
    "scannerId": "SCANNER-001"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "sessionId": "uuid",
    "message": "Verification request sent to admin",
    "status": "pending"
  }
  ```

#### Get Session Status
- **GET** `/booth/session-status/:sessionId`

#### Get Pending Verifications for Booth
- **GET** `/booth/pending-verifications/:boothId`

### Admin Verification

#### Verify or Reject Voter
- **POST** `/admin/verify`
- **Body (Approve):**
  ```json
  {
    "sessionId": "uuid",
    "action": "approve",
    "adminId": "ADMIN-001"
  }
  ```
- **Body (Reject):**
  ```json
  {
    "sessionId": "uuid",
    "action": "reject",
    "adminId": "ADMIN-001",
    "reason": "Photo mismatch"
  }
  ```
- **Response (Approve):**
  ```json
  {
    "success": true,
    "sessionId": "uuid",
    "status": "verified",
    "votingToken": "eyJ...",
    "voterDetails": {...}
  }
  ```

#### Get Pending Verifications
- **GET** `/admin/pending-verifications?boothId=BOOTH-001&limit=50`

#### Get Verification Statistics
- **GET** `/admin/stats?boothId=BOOTH-001&startDate=2025-02-20&endDate=2025-02-22`

### Voting

#### Cast Vote
- **POST** `/vote/cast`
- **Body:**
  ```json
  {
    "votingToken": "eyJ...",
    "candidateId": "CAND-001",
    "candidateName": "John Doe",
    "partyName": "Democratic Party"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Vote recorded successfully",
    "receipt": "record_id",
    "timestamp": "2025-02-22T10:35:00Z"
  }
  ```

#### Get Vote Statistics
- **GET** `/vote/stats?boothId=BOOTH-001&constituency=constituency-1`

#### Get Constituency Statistics
- **GET** `/vote/constituency-stats?startDate=2025-02-20`

## Real-Time Features (Socket.io)

### Admin Dashboard Events

**Incoming:**
- `new-verification-request` - New voter needs verification
- `vote-cast` - Vote recorded
- `stats-update` - Real-time stats

**Outgoing:**
- `join-dashboard` - Admin joins dashboard

### Booth Scanner Events

**Incoming:**
- `verification-approved` - Voter approved by admin
- `verification-rejected` - Voter rejected

**Outgoing:**
- `join-booth` - Booth joins
- `join-session` - Voter joins session

## Workflow Sequence

### Step 1: Voter Registration
1. Voter registers with ID, photo, contact info
2. Voter details stored in database

### Step 2: QR Code Generation
1. Voter requests QR code generation
2. System generates JWT token with voter info
3. QR code created containing verification URL
4. QR code displayed to voter (print or digital)

### Step 3: Polling Station Scanning
1. Voter presents QR code at polling station
2. Scanner reads QR code using camera
3. System extracts and verifies token
4. Verification session created in pending state
5. Admin dashboard receives notification

### Step 4: Admin Verification
1. Admin sees voter in verification queue
2. Admin reviews voter photo and details
3. Admin clicks "Approve" or "Reject"
4. If approved: One-time voting token generated
5. If rejected: Verification session marked rejected

### Step 5: Voting
1. Voter receives one-time voting token (10-minute validity)
2. Voter proceeds to voting interface
3. Voter selects candidate
4. Vote submitted with voting token
5. System verifies token and records vote
6. Voter marked as "hasVoted"
7. Session marked as "completed"

## Database Models

### Voter
```javascript
{
  voterId: String,           // Unique identifier
  name: String,
  phone: String,
  email: String,
  photoUrl: String,          // For visual verification
  constituency: String,
  boothId: String,
  hasVoted: Boolean,         // false until vote cast
  qrCodeToken: String,       // JWT token in QR
  qrCodeExpiry: Date,        // 24 hours
  status: String,            // registered, qr-generated, verified, voted, rejected
  createdAt: Date,
  updatedAt: Date
}
```

### VerificationSession
```javascript
{
  sessionId: String,         // UUID
  voterId: String,
  voterDetails: Object,      // Snapshot for display
  boothId: String,
  scannerId: String,         // Which device scanned
  status: String,            // pending, verified, rejected, voting, completed
  adminId: String,           // Who verified
  createdAt: Date,
  verifiedAt: Date,
  rejectionReason: String,
  voteCastAt: Date
}
```

### VoteRecord
```javascript
{
  sessionId: String,         // UUID
  voterId: String,
  constituency: String,
  boothId: String,
  candidateId: String,
  candidateName: String,
  partyName: String,
  timestamp: Date,
  ipAddress: String,
  deviceInfo: String,
  verificationHash: String   // For audit trail
}
```

## Security Features

1. **JWT Encryption**: Both QR tokens and voting tokens use JWT with secrets
2. **Token Expiry**: QR codes valid for 24h, voting tokens for 10 minutes
3. **Session Management**: Each scan creates unique session
4. **One-time Voting**: Voter can only vote once
5. **Admin Approval**: All verifications require admin review
6. **Audit Trail**: All actions logged with timestamps
7. **IP Tracking**: Vote records include IP address for audit
8. **Photo Verification**: Admin visually verifies voter before approval

## Frontend Integration

### Admin Dashboard (`/admin/dashboard`)
- Real-time verification queue
- Live statistics
- One-click approve/reject
- Voter photo preview
- Session management

### Booth Scanner (`/booth/scanner`)
- QR code camera scanning
- Manual token input fallback
- Real-time verification status
- Connection status indicator
- Session tracking

## Customization

### Change Token Expiry
Edit `.env`:
```env
TOKEN_EXPIRY=48h            # 48 hours for QR codes
VOTING_TOKEN_EXPIRY=15m     # 15 minutes for voting
```

### Change JWT Secrets
Edit `.env` (MUST do in production):
```env
JWT_SECRET=your-new-super-secret-key
VOTING_SECRET=your-new-voting-secret-key
```

### Connect to Different Database
Edit `.env`:
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/voting-system
```

### Change Server Port
Edit `.env`:
```env
PORT=3000
HOST=0.0.0.0
```

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check `MONGODB_URI` in `.env`
- Verify network connectivity if using MongoDB Atlas

### QR Code Not Scanning
- Ensure adequate lighting
- Camera permissions granted
- Try manual token input
- Check token hasn't expired

### Admin Not Receiving Notifications
- Check Socket.io connection status
- Verify admin is in correct room (`admin-dashboard`)
- Check browser console for errors

### Voting Token Expired
- Token valid for 10 minutes after verification
- Complete voting within time window
- If expired, request new verification

## Performance Optimization

- Indexed MongoDB queries for fast lookups
- Aggregate pipelines for statistics
- Socket.io namespacing for efficient event delivery
- Token caching for repeated requests
- Session pooling for database connections

## Monitoring

Check health endpoint:
```bash
GET /health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2025-02-22T10:35:00Z",
  "mongodb": "connected"
}
```

## Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Change `JWT_SECRET` to strong random string
- [ ] Change `VOTING_SECRET` to strong random string
- [ ] Set `CORS_ORIGIN` to specific domain
- [ ] Use MongoDB Atlas or secured instance
- [ ] Enable HTTPS
- [ ] Set up rate limiting
- [ ] Configure firewall rules
- [ ] Set up backups
- [ ] Enable audit logging
- [ ] Configure monitoring/alerts

## Support

For issues or questions, contact the development team.
