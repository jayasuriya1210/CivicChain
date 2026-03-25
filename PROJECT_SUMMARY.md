## COMPLETE DECENTRALIZED VOTING SYSTEM - PROJECT SUMMARY

This project includes blockchain voting, QR-based verification, face recognition, and an admin dashboard with live updates.

---

## PROJECT COMPLETION STATUS

BLOCKCHAIN LAYER
- Smart contract (Voting.sol)
- Truffle configuration for local testing
- Migration script for deployment

BACKEND LAYER
- Express.js server
- JWT authentication
- Auth, face, vote, admin, and QR bridge routes
- API endpoints for all operations
- Environment configuration

QR VERIFICATION MODULE (SEPARATE SERVICE)
- Full QR registration and verification workflow
- Booth scanner UI
- Admin approval dashboard
- QR display page
- Voter registry stored in QR module DB

FACE RECOGNITION INTEGRATION
- Python service with Flask API
- Uses your trained embeddings and labels
- Face verification enforced after QR approval

FRONTEND LAYER
- Login, face verification, voting, admin, results
- Minimal neutral theme
- Live vote updates on admin dashboard

DOCUMENTATION
- README.md
- QUICK_START.md
- This summary

---

## COMPLETE FILE STRUCTURE (TOP-LEVEL)

c:\Users\Shreenithi\OneDrive\Documents\mini voting\
|
|-- README.md
|-- QUICK_START.md
|-- PROJECT_SUMMARY.md
|-- blockchain/
|-- backend/
|-- frontend/
|-- qr/           (QR module app and UI)

---

## CONTINUOUS WORKFLOW (END-TO-END)

1) Voter registers in QR module
   - URL: http://localhost:3000/register
2) Voter logs in to main app
   - URL: http://localhost:5000
3) QR code is displayed (QR module)
   - URL: http://localhost:3000/qr/display?voterId=...
4) Booth scans QR and sends for admin approval
   - URL: http://localhost:3000/booth/scanner
5) Admin approves QR request
   - URL: http://localhost:3000/admin/dashboard
6) Booth scanner redirects to face verification
   - URL: http://localhost:5000/face.html?sessionId=...
7) Face verification passes -> voter can vote
   - URL: http://localhost:5000/vote.html

---

## QUICK START (TERMINAL COMMANDS)

# Terminal 1 - Ganache
 ganache-cli -h 127.0.0.1 -p 7545 --network-id 5777

# Terminal 2 - Deploy contract
 cd blockchain
 truffle migrate --network ganache

# Terminal 3 - Backend server
 cd backend
 npm start

# Terminal 4 - Face recognition service
 cd backend\face_model
 .\venv\Scripts\activate
 python face_verify.py

# Terminal 5 - QR module
 cd qr\qr
 node qr-auth-server.js

NOTE: Use http://localhost:5000 for the main app (do not use python -m http.server for POST APIs).

---

## DEFAULT CREDENTIALS

Main Admin (Voting App)
- URL: http://localhost:5000/admin.html
- Username: admin
- Password: admin@123

QR Module Admin
- URL: http://localhost:3000/admin/login
- Username: admin
- Password: admin123

---

## KEY FEATURES

VOTERS
- QR registration and QR verification
- Face verification after QR approval
- One vote per voter
- Live results

ADMINS (Voting App)
- Add candidates
- Live vote list
- Total voters, candidates, votes
- Voting schedule and reset

ADMINS (QR Module)
- Approve/reject QR requests
- Monitor verification sessions

---

## API ENDPOINTS (BACKEND)

Auth
- POST /api/auth/login
- GET /api/auth/voter-info

Face
- POST /api/face/verify
- GET /api/face/status

Vote
- GET /api/vote/candidates
- POST /api/vote/cast-vote
- GET /api/vote/results
- GET /api/vote/voter-status

Admin
- POST /api/admin/login
- POST /api/admin/add-candidate
- GET /api/admin/statistics

---

## PORT ALLOCATION

- Ganache: 7545
- Backend: 5000
- Face service: 5001
- QR module: 3000

---

## SUPPORT NOTES

- If contract deploy shows "sender account not recognized", restart Ganache and redeploy.
- If port 7545 is in use, close the existing Ganache window.
- QR module must be running for voter registration and QR verification.

---

## YOU'RE ALL SET

Your system now includes QR-based verification before face verification, with continuous flow from registration to voting.
