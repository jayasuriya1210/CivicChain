/* global jsQR */
(function initQrLogin() {
  var statusEl = document.getElementById('status');
  var proceedBtn = document.getElementById('proceedBtn');
  var cameraSelect = document.getElementById('cameraSelect');
  var startBtn = document.getElementById('startBtn');
  var stopBtn = document.getElementById('stopBtn');
  var integratedBtn = document.getElementById('integratedBtn');
  var fileInput = document.getElementById('fileInput');
  var videoEl = document.getElementById('video');
  var hasVerified = false;
  var currentStream = null;
  var currentDeviceId = null;
  var rafId = null;
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');

  function isLocalhost() {
    return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  }

  function isSecure() {
    return window.isSecureContext || location.protocol === 'https:' || isLocalhost();
  }

  function setStatus(text, ok) {
    statusEl.textContent = text;
    statusEl.className = 'status ' + (ok ? 'ok' : 'err');
  }

  function verifyCredential(credential) {
    var url = 'http://localhost:5000/login';
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: credential })
    }).then(function(res) {
      if (!res.ok) return res.json().then(function(j){ throw j; });
      return res.json();
    });
  }

  function populateCameras() {
    var ensurePermission = Promise.resolve();
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      ensurePermission = navigator.mediaDevices.getUserMedia({ video: true })
        .then(function(stream){ stream.getTracks().forEach(function(t){ t.stop(); }); })
        .catch(function(){ /* ignore */ });
    }
    ensurePermission.then(function(){ return navigator.mediaDevices.enumerateDevices(); })
      .then(function(devices){
        var videos = devices.filter(function(d){ return d.kind === 'videoinput'; });
        cameraSelect.innerHTML = '';
        if (!videos.length) {
          var opt = document.createElement('option');
          opt.textContent = 'No camera found';
          cameraSelect.appendChild(opt);
          startBtn.disabled = true;
          return;
        }
        videos.forEach(function(d, idx){
          var opt = document.createElement('option');
          opt.value = d.deviceId;
          opt.textContent = d.label || ('Camera ' + (idx + 1));
          cameraSelect.appendChild(opt);
        });
        currentDeviceId = videos[0].deviceId;
        cameraSelect.value = currentDeviceId;
      })
      .catch(function(e){ setStatus('Camera list error: ' + (e && e.message ? e.message : e), false); });
  }

  function stopTracks() {
    if (currentStream) {
      currentStream.getTracks().forEach(function(t){ t.stop(); });
      currentStream = null;
    }
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  function startScan(deviceIdOrFacingMode) {
    var constraints = { video: {} };
    if (typeof deviceIdOrFacingMode === 'string' && (deviceIdOrFacingMode === 'user' || deviceIdOrFacingMode === 'environment')) {
      constraints.video.facingMode = deviceIdOrFacingMode;
    } else if (deviceIdOrFacingMode) {
      constraints.video.deviceId = { exact: deviceIdOrFacingMode };
    } else if (currentDeviceId) {
      constraints.video.deviceId = { exact: currentDeviceId };
    } else {
      constraints.video.facingMode = 'user';
    }

    navigator.mediaDevices.getUserMedia(constraints).then(function(stream){
      stopTracks();
      currentStream = stream;
      videoEl.srcObject = stream;
      startBtn.disabled = true;
      stopBtn.disabled = false;
      setStatus('Camera started. Scanning…', true);

      function tick() {
        if (!videoEl.videoWidth) { rafId = requestAnimationFrame(tick); return; }
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
        if (code && code.data) {
          if (hasVerified) return;
          hasVerified = true;
          setStatus('Scanned. Verifying…', true);
          stopTracks();
          verifyCredential(code.data)
            .then(function(response){
              setStatus('Verified! You can proceed.', true); 
              proceedBtn.disabled = false;
              // Store QR data for use in other pages
              localStorage.setItem('scannedQR', code.data);
            })
            .catch(function(err){
              var msg = (err && err.error) ? err.error : 'Verification failed';
              setStatus(msg, false); proceedBtn.disabled = true; hasVerified = false;
            });
          return;
        }
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);
    }).catch(function(e){
      setStatus('Camera start failed: ' + (e && e.message ? e.message : e), false);
      startBtn.disabled = false;
      stopBtn.disabled = true;
    });
  }

  function startIntegrated() {
    startBtn.disabled = true;
    stopBtn.disabled = false;
    // Use facingMode constraint to prefer user (front) camera
    var constraints = { facingMode: { exact: 'user' } };
    scanner.start(
      { facingMode: 'user' },
      { fps: 10, qrbox: 250 },
      function onScanSuccess(decodedText) {
        if (hasVerified) return;
        setStatus('Scanned. Verifying…', true);
        hasVerified = true;
        scanner.stop().catch(function(){});
        startBtn.disabled = false;
        stopBtn.disabled = true;
        verifyCredential(decodedText)
          .then(function(response) {
            setStatus('Verified! You can proceed.', true);
            proceedBtn.disabled = false;
            // Store QR data for use in other pages
            localStorage.setItem('scannedQR', decodedText);
          })
          .catch(function(err) {
            var msg = (err && err.error) ? err.error : 'Verification failed';
            setStatus(msg, false);
            proceedBtn.disabled = true;
            hasVerified = false;
          });
      },
      function onScanFailure() { }
    ).catch(function(e){
      startBtn.disabled = false;
      stopBtn.disabled = true;
      setStatus('Integrated camera start failed: ' + (e && e.message ? e.message : e), false);
    });
  }

  function stopScan() {
    stopTracks();
    startBtn.disabled = false;
    stopBtn.disabled = true;
    setStatus('Camera stopped.', true);
  }

  // Fallback: scan from uploaded image
  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      setStatus('Reading image…', true);
      var reader = new FileReader();
      reader.onload = function() {
        var img = new Image();
        img.onload = function(){
          canvas.width = img.width; canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          var code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
          if (code && code.data) {
            setStatus('Scanned from image. Verifying…', true);
            verifyCredential(code.data)
          .then(function(response) {
            setStatus('Verified! You can proceed.', true);
            proceedBtn.disabled = false;
            // Store QR data for use in other pages
            localStorage.setItem('scannedQR', code.data);
          })
          .catch(function(err) {
            var msg = (err && err.error) ? err.error : 'Verification failed';
            setStatus(msg, false);
            proceedBtn.disabled = true;
            });
          } else {
            setStatus('No QR detected in image.', false);
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // UI bindings
  if (cameraSelect) {
    cameraSelect.addEventListener('change', function() {
      currentDeviceId = cameraSelect.value;
    });
  }
  if (startBtn) startBtn.addEventListener('click', function(){ startScan(cameraSelect.value); });
  if (stopBtn) stopBtn.addEventListener('click', stopScan);
  if (integratedBtn) integratedBtn.addEventListener('click', function(){ startScan('user'); });

  setStatus('Select camera and start scanning.', true);
  if (!isSecure()) {
    setStatus('Camera blocked: open this page via http://localhost or HTTPS.', false);
  } else {
    populateCameras();
  }
})();
