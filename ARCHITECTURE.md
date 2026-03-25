# Mini Voting System - Architecture & Flow Diagrams

## 🏗️ SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    DECENTRALIZED VOTING SYSTEM              │
└─────────────────────────────────────────────────────────────┘

                          FRONTEND (Port 8000)
                   ┌─────────────────────────────┐
                   │  Browser (http://localhost) │
                   ├─────────────────────────────┤
                   │ • Voter Login Page          │
                   │ • Face Verification Page    │
                   │ • Voting Page               │
                   │ • Admin Dashboard           │
                   │ • Results Page              │
                   └──────────────┬──────────────┘
                                  │
                    ┌─────────────────────────────┐
                    │      BACKEND APIs           │
                    │     (Port 5000 & 5001)      │
                    ├─────────────────────────────┤
        ┌───────────┼────────────┬────────────┬──┼──────────┐
        │           │            │            │  │          │
   ┌─────────┐  ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌────────┐
   │  Auth   │  │  Face    │ │  Vote    │ │ Admin  │ │Health  │
   │  API    │  │  Verify  │ │  API     │ │ API    │ │ Check  │
   │(JWT)    │  │  API     │ │(Voting)  │ │(CRUD)  │ └────────┘
   └────┬────┘  └─────┬────┘ └────┬─────┘ └───┬────┘
        │             │           │           │
        │      ┌──────────────────┴───────────┘
        │      │
    ┌───┴──────┴───────────────────────────┐
    │      Smart Contract Layer             │
    ├───────────────────────────────────────┤
    │  BLOCKCHAIN (Ganache on Port 7545)    │
    ├───────────────────────────────────────┤
    │    Voting.sol Smart Contract          │
    │  • Voter Management                   │
    │  • Candidate Management               │
    │  • Vote Casting & Counting            │
    │  • Result Determination               │
    └───────────────────────────────────────┘
         │
    ┌────┴──────────────────────────────────┐
    │      AI/ML Layer (Python)             │
    ├───────────────────────────────────────┤
    │  Face Recognition Service             │
    │  (Port 5001)                          │
    │  • Face Detection (OpenCV)            │
    │  • Embedding Extraction               │
    │  • Face Matching (Your Model)         │
    │  • Verification Response              │
    └───────────────────────────────────────┘
         │
    ┌────┴──────────────────────────────────┐
    │      Machine Learning Models          │
    ├───────────────────────────────────────┤
    │  known_embeddings.npy (Your Model)    │
    │  known_labels.npy (Voter Labels)      │
    │  Pre-trained on Your Dataset          │
    └───────────────────────────────────────┘
```

---

## 🔄 VOTER FLOW DIAGRAM

```
START: http://localhost:8000
   │
   ▼
┌─────────────────────┐
│  VOTER LOGIN PAGE   │
│  (index.html)       │
└──────────┬──────────┘
           │
    Enter Voter ID (12 digits)
    Enter Wallet Address
           │
           ▼
    ┌──────────────────┐
    │ POST /api/auth/  │
    │     login        │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────┐
    │ Backend Validation   │
    │ Generate JWT Token   │
    └────────┬─────────────┘
             │
             ▼ (Token saved to localStorage)
┌─────────────────────────┐
│ FACE VERIFICATION PAGE  │
│ (face.html)             │
└──────────┬──────────────┘
           │
    Start Camera
    Capture Photo
           │
           ▼
    ┌──────────────────┐
    │ POST /api/face/  │
    │     verify       │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Python Face Service      │
    │ • Load image             │
    │ • Detect face            │
    │ • Extract embedding      │
    │ • Compare with model     │
    │ • Return confidence      │
    └────────┬─────────────────┘
             │
             ├─→ Match Found? ✓
             │        │
             │        ▼
             │   ┌──────────────────┐
             │   │ VOTING PAGE      │
             │   │ (vote.html)      │
             │   └────────┬─────────┘
             │            │
             │     Select Candidate
             │            │
             │            ▼
             │     ┌──────────────────┐
             │     │ POST /api/vote/  │
             │     │   cast-vote      │
             │     └────────┬─────────┘
             │              │
             │              ▼
             │     ┌──────────────────┐
             │     │ Smart Contract   │
             │     │ Record Vote      │
             │     │ Update Counts    │
             │     └────────┬─────────┘
             │              │
             │              ▼
             │     ┌──────────────────┐
             │     │ Success Message  │
             │     │ Vote Recorded    │
             │     └────────┬─────────┘
             │              │
             │              ▼
             │     ┌──────────────────┐
             │     │ RESULTS PAGE     │
             │     │ (result.html)    │
             │     │ Live Vote Count  │
             │     │ Rankings         │
             │     │ Percentages      │
             │     └──────────────────┘
             │
             └─→ No Match? ✗
                      │
                      ▼
                 Try Again
                      │
                 Capture Photo Again
```

---

## 👨‍💼 ADMIN FLOW DIAGRAM

```
START: http://localhost:8000/admin.html
   │
   ▼
┌──────────────────────┐
│  ADMIN LOGIN PAGE    │
│  (admin.html)        │
└──────────┬───────────┘
           │
    Username: admin
    Password: admin@123
           │
           ▼
    ┌──────────────────┐
    │ POST /api/admin/ │
    │      login       │
    └────────┬─────────┘
             │
             ▼ (Admin token saved)
    ┌──────────────────────────┐
    │   ADMIN DASHBOARD        │
    └──────────┬───────────────┘
               │
        ┌──────┴────────┬──────────────┬──────────────┐
        │               │              │              │
        ▼               ▼              ▼              ▼
    ┌─────────┐   ┌──────────┐  ┌────────────┐  ┌─────────┐
    │Dashboard│   │  Manage  │  │   Voting   │  │  View   │
    │         │   │Candidates│  │  Schedule  │  │ Results │
    │ Stats   │   │          │  │            │  │         │
    │ Status  │   │ • Add    │  │ • Set Date │  │ • Live  │
    └────┬────┘   │ • Edit   │  │   & Time   │  │   Votes │
         │        │ • Delete │  │ • End      │  │ • Charts│
         │        │          │  │   Voting   │  │ • Export│
         │        └────┬─────┘  └────┬───────┘  └────┬────┘
         │             │             │              │
         │             ▼             ▼              ▼
         │    ┌─────────────────┐   ┌──────────┐   ┌────────┐
         │    │POST /api/admin/ │   │PUT/POST  │   │GET /   │
         │    │ add-candidate   │   │api/admin/│   │api/    │
         │    └────────┬────────┘   │set-vote  │   │results │
         │             │            │schedule  │   └────┬───┘
         │             ▼            └────┬─────┘        │
         │    Blockchain Update         │              │
         │    Candidate List            ▼              │
         │    Updated ✓          Voting Period Set    │
         │                       Start: 2024-02-22     │
         │                       End: 2024-02-29       │
         │                                             │
         └──────────────────────┬──────────────────────┘
                                │
                                ▼
                        ┌────────────────────┐
                        │  SETTINGS          │
                        │                    │
                        │ • Change Password  │
                        │ • View Statistics  │
                        │ • System Status    │
                        │ • Reset Votes      │
                        └────────────────────┘
```

---

## 🔗 API REQUEST/RESPONSE FLOW

```
VOTER AUTHENTICATION FLOW:
┌──────────────────────┐
│ Client (Browser)     │
└──────────┬───────────┘
           │ POST /api/auth/login
           │ { voterId, walletAddress }
           │
           ▼
┌──────────────────────┐
│ Backend Server       │
│ auth.js              │
└──────────┬───────────┘
           │ Validate voterId (12 digits)
           │ Check if voter exists
           │ Generate JWT token
           │
           ▼
┌──────────────────────┐
│ Return Response      │
│ { token, voter }     │
│ Status: 200 ✓        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Client saves token   │
│ localStorage.token   │
└──────────────────────┘

VOTING FLOW:
┌──────────────────────┐
│ Client (Browser)     │
│ Send with auth       │
│ header: Bearer token │
└──────────┬───────────┘
           │ POST /api/vote/cast-vote
           │ { candidateId }
           │ Headers: Authorization
           │
           ▼
┌──────────────────────┐
│ Backend Server       │
│ vote.js              │
│ Verify JWT           │
│ Check face verified  │
│ Check not voted yet  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Smart Contract       │
│ recordVote()         │
│ Update vote count    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Return Success       │
│ Status: 200 ✓        │
│ Message: Voted!      │
└──────────────────────┘
```

---

## 📊 SMART CONTRACT STATE DIAGRAM

```
┌────────────────────────────────┐
│   Initial State (Deployed)     │
├────────────────────────────────┤
│ • No voters registered         │
│ • No candidates added          │
│ • No voting round active       │
│ • Total votes = 0              │
└────────────────────┬───────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
  ┌──────────────┐         ┌──────────────┐
  │ Add          │         │ Register     │
  │ Candidates   │         │ Voters       │
  │              │         │              │
  │ (Admin only) │         │ (Admin only) │
  └──────┬───────┘         └──────┬───────┘
         │                        │
         ▼                        ▼
  ┌──────────────────────────────────┐
  │  Create Voting Round             │
  │  Set start and end times         │
  │  Voting Round Activated          │
  └────────────┬─────────────────────┘
               │
        ┌──────┴──────┐
        │             │
   Voting Active  Voting Time?
        │          Passed
        │
        ├─────────────┐
        │             │
        ▼             ▼
   ┌──────────┐  ┌──────────┐
   │Voter ID  │  │Auto Ends │
   │Match ✓   │  │Voting    │
   │Face      │  │Period    │
   │Verify ✓  │  │Closed    │
   │          │  │          │
   │Can Vote  │  │Show      │
   │   │      │  │Results   │
   │   ▼      │  │          │
   │┌──────┐  │  └────┬─────┘
   ││ Vote │  │       │
   │└──┬───┘  │       │
   │   │      │       │
   │   └──┬───┴───────┘
   │      │
   │      ▼
   │  ┌────────────────┐
   │  │ Vote Recorded  │
   │  │ Blockchain     │
   │  │ Immutable      │
   │  │                │
   │  │ hasVoted[addr] │
   │  │   = true       │
   │  │                │
   │  │ candidates[x]  │
   │  │ .voteCount++   │
   │  │                │
   │  │ totalVotes++   │
   │  └────────┬───────┘
   │           │
   │           ▼
   │  ┌────────────────────┐
   │  │ Admin Can:         │
   │  │ • View Results     │
   │  │ • End Voting       │
   │  │ • Reset for new    │
   │  │   election         │
   │  └────────────────────┘
   │
   └─────────────────────────────────→ All Votes Final & Immutable
```

---

## 📈 DATA FLOW DIAGRAM

```
User Input
    │
    ├─→ Voter ID (12 digits)
    │      │
    │      ▼
    │   Backend Validation
    │   (Voter.js model)
    │      │
    │      ▼
    │   In-Memory Storage
    │   (voters object)
    │
    ├─→ Face Image (JPG/PNG)
    │      │
    │      ▼
    │   Uploaded to backend
    │      │
    │      ▼
    │   Python Face Service
    │      │
    │      ├─→ OpenCV Detection
    │      │
    │      ├─→ Load Face Model
    │      │   (known_embeddings.npy)
    │      │   (known_labels.npy)
    │      │
    │      ├─→ Extract Features
    │      │
    │      ├─→ Calculate Distance
    │      │
    │      ▼
    │   Verification Result
    │   (confidence score)
    │      │
    │      ▼
    │   Backend Updates
    │   voter.isVerified = true
    │
    ├─→ Vote Selection
    │      │
    │      ▼
    │   Smart Contract
    │      │
    │      ├─→ Check: Face verified ✓
    │      ├─→ Check: Not voted yet ✓
    │      ├─→ Check: Time valid ✓
    │      │
    │      ▼
    │   Blockchain Storage
    │      │
    │      ├─→ candidates[id].voteCount++
    │      ├─→ hasVoted[address] = true
    │      ├─→ totalVotes++
    │      │
    │      ▼
    │   Emit Vote Event
    │      │
    │      ▼
    │   Results Updated
    │      │
    │      ├─→ Sort by votes
    │      ├─→ Calculate %
    │      ├─→ Find leader
    │      │
    │      ▼
    │   Display to Users
    │
    └─→ Results Viewing
           │
           ▼
        Smart Contract
           │
           ├─→ Read vote counts
           ├─→ Calculate totals
           ├─→ Determine winner
           │
           ▼
        API Response
           │
           ▼
        Browser Display
           │
           ▼
        Live Results Page
```

---

## 🔐 SECURITY FLOW DIAGRAM

```
┌──────────────────────────────────┐
│  Multi-Factor Authentication     │
├──────────────────────────────────┤
│                                  │
│  FACTOR 1: Voter ID              │
│  ├─ 12-digit format              │
│  ├─ Must exist in system         │
│  └─ Generates JWT token          │
│                                  │
│  FACTOR 2: Face Recognition      │
│  ├─ ML-based verification        │
│  ├─ Your trained model           │
│  ├─ Embeddings comparison        │
│  └─ Confidence threshold          │
│                                  │
└────────────┬─────────────────────┘
             │
             ▼
    ┌──────────────────┐
    │  All Factors OK? │
    └────────┬─────────┘
             │
      ┌──────┴──────┐
      │             │
     YES           NO
      │             │
      ▼             ▼
    ┌───┐      ┌────────────┐
    │ ✓ │      │ Access     │
    │   │      │ Denied     │
    └─┬─┘      │ Return 403 │
      │        └────────────┘
      │
      ▼
    ┌──────────────────────┐
    │ Blockchain Security  │
    ├──────────────────────┤
    │                      │
    │ • Immutable records  │
    │ • Vote encryption    │
    │ • Timestamp proof    │
    │ • Gas limits         │
    │ • Modifier access    │
    │                      │
    └──────────────────────┘
```

---

## 🌐 NETWORK TOPOLOGY

```
INTERNET (Port 8000)
    │
┌───┴──────────────────────────────────┐
│       LOCAL MACHINE                  │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Port 8000 - Frontend Server    │  │
│  │ HTML/CSS/JavaScript            │  │
│  │ Static files                   │  │
│  └────────────────┬───────────────┘  │
│                   │                  │
│                   │ HTTP requests    │
│                   │                  │
│  ┌────────────────▼───────────────┐  │
│  │ Port 5000 - Backend Server     │  │
│  │ Express.js                     │  │
│  │ API routes                     │  │
│  │ JWT verification               │  │
│  └────────────────┬───────────────┘  │
│                   │                  │
│         ┌─────────┴──────────┐        │
│         │                    │        │
│  ┌──────▼──────┐      ┌──────▼──────┐│
│  │Port 7545    │      │Port 5001    ││
│  │Ganache      │      │Face Service ││
│  │Blockchain   │      │Python Flask ││
│  │Network      │      │ML models    ││
│  └─────────────┘      └─────────────┘│
│                                      │
└──────────────────────────────────────┘

All services run on 127.0.0.1 (localhost)
```

---

## 📱 COMPONENT DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    Mini Voting System                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FRONTEND COMPONENTS                                        │
│  ├── index.html (Login)                                    │
│  ├── face.html (Verification)                              │
│  ├── vote.html (Voting)                                    │
│  ├── admin.html (Management)                               │
│  ├── result.html (Results)                                 │
│  └── css/style.css (Styling)                               │
│                                                             │
│  BACKEND COMPONENTS                                         │
│  ├── server.js (Express app)                               │
│  ├── routes/                                               │
│  │   ├── auth.js (Voter authentication)                    │
│  │   ├── face.js (Face verification)                       │
│  │   ├── vote.js (Voting operations)                       │
│  │   └── admin.js (Admin operations)                       │
│  ├── models/                                               │
│  │   ├── Voter.js (Voter data model)                       │
│  │   └── Candidate.js (Candidate model)                    │
│  └── face_model/                                           │
│      └── face_verify.py (ML verification)                  │
│                                                             │
│  BLOCKCHAIN COMPONENTS                                      │
│  ├── contracts/                                            │
│  │   └── Voting.sol (Smart contract)                       │
│  ├── migrations/                                           │
│  │   └── 1_deploy_contract.js                              │
│  └── truffle-config.js (Configuration)                     │
│                                                             │
│  ML/AI COMPONENTS                                           │
│  ├── Face Detection (OpenCV)                               │
│  ├── Embedding Extraction                                  │
│  ├── Model Files (.npy)                                    │
│  └── Distance Calculation (sklearn)                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

This comprehensive architecture ensures:
- ✅ Secure voter authentication
- ✅ Decentralized voting via blockchain
- ✅ AI-powered face recognition
- ✅ Real-time results
- ✅ Admin controls
- ✅ Scalability and transparency
