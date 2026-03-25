/**
 * Polling Booth Scanner - QR Code Scanning and Verification
 */

let socket;
let videoStream = null;
let canvas = null;
let isScanning = false;
let boothId = null;
let sessionSocket = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeSocket();
  getBoothInfo();
  setupCanvasForScanning();
});

// Initialize Socket.io connection
function initializeSocket() {
  socket = io();

  socket.on('connect', () => {
    console.log('Connected to server');
    updateConnectionStatus(true);
    if (boothId) {
      socket.emit('booth:register', { boothId });
    }
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    updateConnectionStatus(false);
  });

  socket.on('booth:verification-approved', (data) => {
    console.log('Verification approved:', data);
    showVerificationModal('approved', data.voterName);
    sessionSocket = null;
  });

  socket.on('booth:verification-rejected', (data) => {
    console.log('Verification rejected:', data);
    showVerificationModal('rejected', data.voterName, data.reason);
    sessionSocket = null;
  });

  socket.on('booth:waiting-for-approval', (data) => {
    console.log('Waiting for approval:', data);
    sessionSocket = data.sessionId;
    showWaitingModal();
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
    showError(error);
  });
}

// Get booth information
async function getBoothInfo() {
  try {
    const response = await fetch('/booth/info');
    const data = await response.json();
    boothId = data.boothId;
    document.getElementById('boothId').textContent = boothId;

    if (socket && socket.connected) {
      socket.emit('booth:register', { boothId });
    }
  } catch (error) {
    console.error('Error getting booth info:', error);
    showError('Failed to load booth information');
  }
}

// Setup canvas for QR code scanning
function setupCanvasForScanning() {
  const container = document.getElementById('cameraContainer');
  canvas = document.createElement('canvas');
  canvas.style.display = 'none';
  container.appendChild(canvas);
}

// Start scanning
async function startScanning() {
  try {
    const cameraError = document.getElementById('cameraError');
    cameraError.classList.remove('show');

    const video = document.getElementById('cameraFeed');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');

    // Request camera access
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });

    video.srcObject = videoStream;
    isScanning = true;

    startBtn.style.display = 'none';
    stopBtn.style.display = 'flex';

    // Start the scanning loop
    scanQRCode();
  } catch (error) {
    console.error('Camera access error:', error);
    const cameraError = document.getElementById('cameraError');
    cameraError.textContent = 'Unable to access camera. Please check permissions and try again.';
    cameraError.classList.add('show');

    // Show manual input option
    document.getElementById('manualInputSection').style.display = 'block';
  }
}

// Stop scanning
function stopScanning() {
  isScanning = false;

  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }

  document.getElementById('cameraFeed').srcObject = null;
  document.getElementById('startBtn').style.display = 'flex';
  document.getElementById('stopBtn').style.display = 'none';
  document.getElementById('resultCard').classList.remove('show');
}

// Scan QR code from video
function scanQRCode() {
  if (!isScanning) return;

  const video = document.getElementById('cameraFeed');
  const ctx = canvas.getContext('2d');

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });

    if (code) {
      console.log('QR Code found:', code.data);
      processScannedCode(code.data);
      return; // Stop scanning once code is found
    }
  }

  requestAnimationFrame(scanQRCode);
}

// Process scanned QR code
async function processScannedCode(qrData) {
  stopScanning();

  try {
    // Extract token from URL or use directly if it's a token
    let token = qrData;
    if (qrData.includes('/verify/')) {
      token = qrData.split('/verify/')[1];
    }

    // Send to backend for verification
    const response = await fetch('/booth/scan-qr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        boothId,
        token
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showResultCard({
        type: 'error',
        title: 'Verification Failed',
        message: data.error || 'Failed to verify QR code'
      });
      return;
    }

    // Show success and wait for admin verification
    showResultCard({
      type: 'info',
      title: 'QR Code Verified',
      message: 'QR code is valid. Forwarding to admin for final verification...'
    });

    // Emit socket event
    if (socket) {
      socket.emit('booth:qr-scanned', {
        boothId,
        voterId: data.voterId,
        voterName: data.name,
        sessionId: data.sessionId,
        timestamp: new Date()
      });
    }

    // Show waiting modal
    showWaitingModal();
  } catch (error) {
    console.error('Error processing QR code:', error);
    showResultCard({
      type: 'error',
      title: 'Error',
      message: 'An error occurred while processing the QR code'
    });
  }
}

// Handle manual paste
function handlePaste() {
  const token = document.getElementById('manualToken').value.trim();
  if (token) {
    processScannedCode(token);
  }
}

// Show result card
function showResultCard(result) {
  const resultCard = document.getElementById('resultCard');
  const resultContent = document.getElementById('resultContent');

  const resultClass = `result-${result.type}`;
  resultCard.className = `result-card show ${resultClass}`;

  let content = `<h3 style="margin-bottom: 10px;">${result.title}</h3>`;
  content += `<p>${result.message}</p>`;

  if (result.data) {
    content += '<div class="result-content">';
    Object.entries(result.data).forEach(([key, value]) => {
      content += `
        <div class="result-field">
          <span class="result-label">${key}:</span>
          <span class="result-value">${value}</span>
        </div>
      `;
    });
    content += '</div>';
  }

  resultContent.innerHTML = content;
}

// Show waiting modal
function showWaitingModal() {
  const modal = document.getElementById('waitingModal');
  modal.classList.add('show');
}

// Show verification modal
function showVerificationModal(status, voterName, reason = '') {
  const modal = document.getElementById('verificationModal');
  const icon = document.getElementById('verificationIcon');
  const title = document.getElementById('verificationTitle');
  const message = document.getElementById('verificationMessage');
  const waitingModal = document.getElementById('waitingModal');

  waitingModal.classList.remove('show');

  if (status === 'approved') {
    icon.textContent = '✓';
    icon.style.color = '#28a745';
    title.textContent = 'Verification Approved';
    message.innerHTML = `
      <strong>${voterName}</strong> has been approved and can now proceed to vote.
    `;
  } else {
    icon.textContent = '✗';
    icon.style.color = '#dc3545';
    title.textContent = 'Verification Rejected';
    message.innerHTML = `
      <strong>${voterName}</strong> has been rejected.
      ${reason ? `<br><br><strong>Reason:</strong> ${reason}` : ''}
    `;
  }

  modal.classList.add('show');
}

// Proceed to voting
function proceedToVoting() {
  const modal = document.getElementById('verificationModal');
  modal.classList.remove('show');

  // Open voting interface or redirect
  window.location.href = '/voting';
}

// Update connection status
function updateConnectionStatus(connected) {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');

  if (connected) {
    dot.classList.add('connected');
    text.textContent = 'Connected';
  } else {
    dot.classList.remove('connected');
    text.textContent = 'Disconnected';
  }
}

// Show error
function showError(message) {
  const resultCard = document.getElementById('resultCard');
  const resultContent = document.getElementById('resultContent');

  resultCard.className = 'result-card show result-error';
  resultContent.innerHTML = `<h3>Error</h3><p>${message}</p>`;
}

// Allow restart by scanning another QR code
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('verificationModal');
    const waitingModal = document.getElementById('waitingModal');

    if (modal.classList.contains('show') || waitingModal.classList.contains('show')) {
      modal.classList.remove('show');
      waitingModal.classList.remove('show');
      startScanning();
    }
  }
});
