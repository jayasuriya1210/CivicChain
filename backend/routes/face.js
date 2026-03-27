// backend/routes/face.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken, voters, saveVoters } = require('../middleware/auth');
const axios = require('axios');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/faces');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Face verification endpoint
router.post('/verify', verifyToken, upload.single('faceImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const voter = voters[req.user.voterId];
    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }
    if (!voter.qrVerified) {
      return res.status(403).json({ message: 'QR verification required before face verification' });
    }

    const imagePath = req.file.path;

    // Call Python face verification script
    try {
      // Send image to Python backend for face verification
      const verificationResult = await callFaceVerification(imagePath, req.user.voterId);

      // Log verification result for debugging
      console.log('Face verification result:', verificationResult);

      const conf = parseFloat(verificationResult.confidence || 0);
      const successFlag = !!verificationResult.success;
      const MIN_CONF = 0.6;

      if (successFlag && conf >= MIN_CONF) {
        // Update voter as verified
        voter.isVerified = true;
        try { saveVoters(); } catch (e) { console.warn('Could not save voters:', e.message); }

        // Clean up uploaded file
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }

        return res.json({
          message: 'Face verification successful',
          verified: true,
          confidence: conf
        });
      } else {
        // Clean up uploaded file
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }

        return res.status(401).json({
          message: 'Face verification failed. Invalid voter: face does not match the registered model.',
          verified: false,
          confidence: conf
        });
      }
    } catch (pythonError) {
      console.error('Python verification error:', pythonError?.message || pythonError);
      // On any python verification failure, do not auto-verify the voter.
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      const status = pythonError?.response?.status || 503;
      const msg = pythonError?.response?.data?.message || 'Face verification failed. Invalid voter face.';
      return res.status(status).json({
        message: msg,
        verified: false
      });
    }
  } catch (error) {
    console.error('Face verification error:', error);
    res.status(500).json({ message: 'Face verification failed', error: error.message });
  }
});

// Helper function to call Python face verification
async function callFaceVerification(imagePath, voterId) {
  try {
    // This would call your Python face verification service
    // For now, returning a mock response
    
    // In production, you would:
    // 1. Send image to Python backend via API
    // 2. Python would load your model and verify face
    // 3. Return confidence score
    
    const faceTimeoutMs = parseInt(process.env.FACE_VERIFY_TIMEOUT_MS || '210000', 10);
    const response = await axios.post('http://localhost:5001/verify-face', {
      imagePath: imagePath,
      voterId: voterId
    }, { timeout: faceTimeoutMs });

    return response.data;
  } catch (error) {
    console.error('Error calling Python service:', error.message);
    throw error;
  }
}

// Get verification status
router.get('/status', verifyToken, (req, res) => {
  try {
    const voter = voters[req.user.voterId];
    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }

    res.json({
      voterId: voter.voterId,
      isVerified: voter.isVerified,
      verifiedAt: voter.verifiedAt || null
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching verification status', error: error.message });
  }
});

module.exports = router;
