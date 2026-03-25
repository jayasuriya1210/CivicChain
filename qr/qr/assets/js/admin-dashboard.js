/**
 * Admin Dashboard - Real-time Verification Queue Management
 */

let socket;
let currentVerificationQueue = [];
let currentSelectedSession = null;

// Initialize Socket.io connection
function initializeSocket() {
  socket = io();

  socket.on('connect', () => {
    console.log('Connected to server');
    updateConnectionStatus(true);
    socket.emit('admin:join-dashboard');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    updateConnectionStatus(false);
  });

  socket.on('admin:verification-queue-update', (data) => {
    console.log('Queue updated:', data);
    currentVerificationQueue = data;
    refreshQueueDisplay();
    updateStatistics();
  });

  socket.on('admin:session-status-changed', (data) => {
    console.log('Session status changed:', data);
    currentVerificationQueue = currentVerificationQueue.map(item =>
      item.sessionId === data.sessionId ? { ...item, status: data.status } : item
    );
    refreshQueueDisplay();
  });

  socket.on('admin:new-verification', (data) => {
    console.log('New verification request:', data);
    showNotification(`New verification request from ${data.voterDetails.name}`, 'info');
    loadVerificationQueue();
  });

  socket.on('admin:booth-connected', (data) => {
    console.log('Booth connected:', data);
    updateBoothsList(data);
  });

  socket.on('admin:booth-disconnected', (data) => {
    console.log('Booth disconnected:', data);
    removeBoothFromList(data.boothId);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
    showNotification('Connection error: ' + error, 'error');
  });
}

// Update connection status indicator
function updateConnectionStatus(connected) {
  const statusEl = document.getElementById('connectionStatus');
  if (connected) {
    statusEl.classList.remove('disconnected');
    statusEl.classList.add('connected');
    statusEl.textContent = '● Connected';
  } else {
    statusEl.classList.remove('connected');
    statusEl.classList.add('disconnected');
    statusEl.textContent = '● Disconnected';
  }
}

// Load verification queue from server
async function loadVerificationQueue() {
  try {
    const response = await fetch('/admin/verification-queue');
    const data = await response.json();
    currentVerificationQueue = data.sessions;
    refreshQueueDisplay();
    updateStatistics();
  } catch (error) {
    console.error('Error loading verification queue:', error);
    showNotification('Failed to load verification queue', 'error');
  }
}

// Refresh the queue display
function refreshQueueDisplay() {
  const tbody = document.getElementById('queueBody');
  const container = document.getElementById('queueContainer');

  if (!currentVerificationQueue || currentVerificationQueue.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px;">
          <div class="empty-state">
            <p>No pending verifications</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = currentVerificationQueue.map(session => `
    <tr>
      <td>${session.voterDetails.voterId}</td>
      <td>${session.voterDetails.name}</td>
      <td>${session.boothId}</td>
      <td>
        <span class="status-badge status-${session.status}">
          ${session.status.charAt(0).toUpperCase() + session.status.slice(1)}
        </span>
      </td>
      <td>${new Date(session.scannedAt).toLocaleString()}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-view" onclick="viewVoterDetails('${session.sessionId}')">
            View
          </button>
          ${session.status === 'pending' ? `
            <button class="btn btn-approve" onclick="approveVoter('${session.sessionId}')">
              Approve
            </button>
            <button class="btn btn-reject" onclick="rejectVoter('${session.sessionId}')">
              Reject
            </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

// View voter details in modal
function viewVoterDetails(sessionId) {
  const session = currentVerificationQueue.find(s => s.sessionId === sessionId);
  if (!session) return;

  currentSelectedSession = session;
  const modal = document.getElementById('voterModal');

  document.getElementById('modalVoterId').textContent = session.voterDetails.voterId;
  document.getElementById('modalVoterName').textContent = session.voterDetails.name;
  document.getElementById('modalBoothId').textContent = session.boothId;
  document.getElementById('modalConstituency').textContent = session.voterDetails.constituency;
  document.getElementById('modalScannedAt').textContent = new Date(session.scannedAt).toLocaleString();
  document.getElementById('modalStatus').textContent = session.status;

  const approveBtn = document.getElementById('approveBtn');
  const rejectBtn = document.getElementById('rejectBtn');

  if (session.status === 'pending') {
    approveBtn.style.display = 'block';
    rejectBtn.style.display = 'block';
  } else {
    approveBtn.style.display = 'none';
    rejectBtn.style.display = 'none';
  }

  modal.style.display = 'flex';
}

// Close modal
function closeModal() {
  document.getElementById('voterModal').style.display = 'none';
  currentSelectedSession = null;
}

// Approve voter
async function approveVoter(sessionId = null) {
  const id = sessionId || currentSelectedSession?.sessionId;
  if (!id) return;

  try {
    const response = await fetch('/admin/verify-voter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: id,
        action: 'approved'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to approve voter');
    }

    showNotification('Voter approved successfully', 'success');
    closeModal();
    loadVerificationQueue();

    // Emit socket event to notify booth
    if (socket) {
      socket.emit('admin:verification-response', {
        sessionId: id,
        action: 'approved',
        votingToken: data.votingToken
      });
    }
  } catch (error) {
    console.error('Error approving voter:', error);
    showNotification('Error: ' + error.message, 'error');
  }
}

// Reject voter
async function rejectVoter(sessionId = null) {
  const id = sessionId || currentSelectedSession?.sessionId;
  if (!id) return;

  const reason = prompt('Enter reason for rejection:');
  if (!reason) return;

  try {
    const response = await fetch('/admin/verify-voter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: id,
        action: 'rejected',
        reason: reason
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to reject voter');
    }

    showNotification('Voter rejected', 'success');
    closeModal();
    loadVerificationQueue();

    // Emit socket event to notify booth
    if (socket) {
      socket.emit('admin:verification-response', {
        sessionId: id,
        action: 'rejected',
        reason: reason
      });
    }
  } catch (error) {
    console.error('Error rejecting voter:', error);
    showNotification('Error: ' + error.message, 'error');
  }
}

// Filter queue by status or booth
function filterQueue() {
  const statusFilter = document.getElementById('statusFilter').value;
  const boothFilter = document.getElementById('boothFilter').value;

  const filtered = currentVerificationQueue.filter(session => {
    const statusMatch = !statusFilter || session.status === statusFilter;
    const boothMatch = !boothFilter || session.boothId === boothFilter;
    return statusMatch && boothMatch;
  });

  const tbody = document.getElementById('queueBody');
  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px;">
          <div class="empty-state">
            <p>No matching verifications</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(session => `
    <tr>
      <td>${session.voterDetails.voterId}</td>
      <td>${session.voterDetails.name}</td>
      <td>${session.boothId}</td>
      <td>
        <span class="status-badge status-${session.status}">
          ${session.status.charAt(0).toUpperCase() + session.status.slice(1)}
        </span>
      </td>
      <td>${new Date(session.scannedAt).toLocaleString()}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-view" onclick="viewVoterDetails('${session.sessionId}')">
            View
          </button>
          ${session.status === 'pending' ? `
            <button class="btn btn-approve" onclick="approveVoter('${session.sessionId}')">
              Approve
            </button>
            <button class="btn btn-reject" onclick="rejectVoter('${session.sessionId}')">
              Reject
            </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

// Update statistics
async function updateStatistics() {
  try {
    const response = await fetch('/admin/statistics');
    const stats = await response.json();

    document.getElementById('totalVoters').textContent = stats.totalVoters || 0;
    document.getElementById('votesCast').textContent = stats.votesCast || 0;
    document.getElementById('pendingVerification').textContent = stats.pendingVerification || 0;
    document.getElementById('approvedVoters').textContent = stats.approvedVoters || 0;
    document.getElementById('rejectedVoters').textContent = stats.rejectedVoters || 0;

    // Populate booth filter
    const boothFilter = document.getElementById('boothFilter');
    const booths = stats.activeBooths || [];
    boothFilter.innerHTML = '<option value="">All Booths</option>' + 
      booths.map(booth => `<option value="${booth}">${booth}</option>`).join('');
  } catch (error) {
    console.error('Error updating statistics:', error);
  }
}

// Update active booths list
function updateBoothsList(booth) {
  const bootList = document.getElementById('boothsList');
  let boothsDiv = bootList.querySelector('[data-booth-list]');

  if (!boothsDiv) {
    boothsDiv = document.createElement('div');
    boothsDiv.setAttribute('data-booth-list', 'true');
    bootList.innerHTML = '';
    bootList.appendChild(boothsDiv);
  }

  const html = `
    <div style="padding: 10px 0; border-bottom: 1px solid #eee;">
      <strong>${booth.boothId}</strong> - ${booth.votersScanned || 0} scans
      <span style="float: right; color: #28a745; font-size: 12px;">● Online</span>
    </div>
  `;

  boothsDiv.innerHTML += html;
}

// Remove booth from list
function removeBoothFromList(boothId) {
  const bootList = document.getElementById('boothsList');
  const boothElements = bootList.querySelectorAll('div');
  boothElements.forEach(el => {
    if (el.textContent.includes(boothId)) {
      el.remove();
    }
  });
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'none';
    notification.remove();
  }, 5000);
}

// Logout
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    window.location.href = '/logout';
  }
}

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById('voterModal');
  if (event.target === modal) {
    closeModal();
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeSocket();
  loadVerificationQueue();
  updateStatistics();

  // Refresh queue and statistics periodically
  setInterval(() => {
    loadVerificationQueue();
    updateStatistics();
  }, 5000);
});
