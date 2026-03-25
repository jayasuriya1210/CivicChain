# QR Code Based Voting Authentication System - API Documentation

## Overview
This is a comprehensive REST API and WebSocket server for a QR code-based voting authentication system with real-time admin verification.

## Base URL
```
http://localhost:3001
```

## Authentication
The system uses JWT tokens for authentication:
- **QR Tokens**: Used for voter verification (24 hours validity)
- **Voting Tokens**: Used for casting votes (10 minutes validity)
- **Admin Tokens**: Used for admin dashboard access

## API Endpoints

### QR Code Generation & Verification

#### Generate QR Code
```http
POST /qr/generate-qr
Content-Type: application/json

{
  "voterId": "V001"
}

Response 200:
{
  "voterId": "V001",
  "qrDataUrl": "data:image/png;base64,...",
  "token": "eyJhbGc...",
  "expiresIn": "24h"
}
```

#### Verify QR Code
```http
GET /qr/verify/:token
Response 200:
{
  "voterId": "V001",
  "name": "John Doe",
  "constituency": "North District",
  "boothId": "B001"
}
```

### Booth Scanner Endpoints

#### Register Booth
```http
POST /booth/register
Content-Type: application/json

{
  "boothId": "B001"
}

Response 201:
{
  "boothId": "B001",
  "registered": true
}
```

#### Scan QR Code
```http
POST /booth/scan-qr
Content-Type: application/json

{
  "boothId": "B001",
  "token": "eyJhbGc..."
}

Response 200:
{
  "sessionId": "sess_123abc",
  "voterId": "V001",
  "name": "John Doe",
  "status": "awaiting_verification"
}
```

#### Get Booth Info
```http
GET /booth/info
Response 200:
{
  "boothId": "B001",
  "status": "active",
  "votersScanned": 42
}
```

### Admin Endpoints

#### Admin Login
```http
POST /admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

Response 200:
{
  "token": "eyJhbGc...",
  "role": "admin"
}
```

#### Get Verification Queue
```http
GET /admin/verification-queue
Authorization: Bearer <admin_token>

Response 200:
{
  "sessions": [
    {
      "sessionId": "sess_123abc",
      "voterId": "V001",
      "voterDetails": {
        "name": "John Doe",
        "email": "john@example.com",
        "constituency": "North District"
      },
      "boothId": "B001",
      "status": "pending",
      "scannedAt": "2024-02-23T10:30:00Z"
    }
  ]
}
```

#### Verify Voter
```http
POST /admin/verify-voter
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "sessionId": "sess_123abc",
  "action": "approved|rejected",
  "reason": "Optional rejection reason"
}

Response 200:
{
  "status": "approved",
  "votingToken": "eyJhbGc...",
  "expiresIn": "10m"
}
```

#### Get Statistics
```http
GET /admin/statistics
Authorization: Bearer <admin_token>

Response 200:
{
  "totalVoters": 1000,
  "votesCast": 342,
  "pendingVerification": 15,
  "approvedVoters": 342,
  "rejectedVoters": 8,
  "activeBooths": ["B001", "B002", "B003"]
}
```

### Voter Endpoints

#### Register Voter
```http
POST /voter/register
Content-Type: application/json

{
  "voterId": "V001",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "constituency": "North District",
  "boothId": "B001",
  "address": "123 Main St"
}

Response 201:
{
  "voterId": "V001",
  "registered": true
}
```

#### Get Voter Info
```http
GET /voter/:voterId

Response 200:
{
  "voterId": "V001",
  "name": "John Doe",
  "status": "registered",
  "hasVoted": false,
  "constituency": "North District"
}
```

### Voting Endpoints

#### Cast Vote
```http
POST /vote/cast
Authorization: Bearer <voting_token>
Content-Type: application/json

{
  "choice": "candidate_123",
  "boothId": "B001"
}

Response 200:
{
  "voteId": "vote_abc123",
  "status": "recorded",
  "timestamp": "2024-02-23T10:35:00Z"
}
```

#### Get Vote Status
```http
GET /vote/status/:voteId
Authorization: Bearer <voting_token>

Response 200:
{
  "voteId": "vote_abc123",
  "status": "recorded",
  "timestamp": "2024-02-23T10:35:00Z"
}
```

## WebSocket Events

### Admin Dashboard Events

#### Join Dashboard
```javascript
socket.emit('admin:join-dashboard');

// Receive queue updates
socket.on('admin:verification-queue-update', (data) => {
  // data contains updated verification sessions
});

// Receive real-time session status changes
socket.on('admin:session-status-changed', (data) => {
  // data: { sessionId, status }
});

// Receive new verification requests
socket.on('admin:new-verification', (data) => {
  // data contains new verification session details
});
```

### Booth Scanner Events

#### Register Booth
```javascript
socket.emit('booth:register', { boothId: 'B001' });

// Receive booth connected notification
socket.on('booth:connected', (data) => {
  // data: { boothId, status }
});

// Notify admin of QR scan
socket.emit('booth:qr-scanned', {
  boothId: 'B001',
  voterId: 'V001',
  voterName: 'John Doe',
  sessionId: 'sess_123abc'
});

// Receive verification response from admin
socket.on('booth:verification-approved', (data) => {
  // data: { voterName, votingToken }
});

socket.on('booth:verification-rejected', (data) => {
  // data: { voterName, reason }
});
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request parameters",
  "timestamp": "2024-02-23T10:30:00Z"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or expired token",
  "timestamp": "2024-02-23T10:30:00Z"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied",
  "timestamp": "2024-02-23T10:30:00Z"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found",
  "timestamp": "2024-02-23T10:30:00Z"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "timestamp": "2024-02-23T10:30:00Z"
}
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error |

## Rate Limiting
- API endpoints are rate-limited to 100 requests per hour per IP
- WebSocket connections are limited to 50 concurrent connections per booth

## Security Notes

### JWT Secrets
- Must be changed in production (.env file)
- Minimum 32 characters recommended
- Use strong random strings

### Token Expiry
- QR tokens: Valid for 24 hours from generation
- Voting tokens: Valid for 10 minutes from verification
- Shorter voting window recommended for security

### CORS
- Configure CORS_ORIGIN environment variable for production
- Default allows all origins in development

## Example Usage

### 1. Voter QR Code Generation
```bash
curl -X POST http://localhost:3001/qr/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"voterId": "V001"}'
```

### 2. Booth Scanner
```bash
curl -X POST http://localhost:3001/booth/scan-qr \
  -H "Content-Type: application/json" \
  -d '{"boothId": "B001", "token": "..."}'
```

### 3. Admin Verification
```bash
curl -X POST http://localhost:3001/admin/verify-voter \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "sess_123abc",
    "action": "approved"
  }'
```

## Support
For issues or questions, please contact the development team.
