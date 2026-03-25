const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Generate QR code as Data URL
 */
const generateQRCodeDataUrl = async (data, options = {}) => {
  try {
    const defaultOptions = {
      width: 300,
      margin: 2,
      color: { 
        dark: '#000000', 
        light: '#ffffff' 
      },
      errorCorrectionLevel: 'H',
      type: 'image/png'
    };

    const mergedOptions = { ...defaultOptions, ...options };
    const qrDataUrl = await QRCode.toDataURL(data, mergedOptions);
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

/**
 * Generate QR code as buffer
 */
const generateQRCodeBuffer = async (data, options = {}) => {
  try {
    const defaultOptions = {
      width: 300,
      margin: 2,
      color: { 
        dark: '#000000', 
        light: '#ffffff' 
      },
      errorCorrectionLevel: 'H'
    };

    const mergedOptions = { ...defaultOptions, ...options };
    const qrBuffer = await QRCode.toBuffer(data, mergedOptions);
    return qrBuffer;
  } catch (error) {
    console.error('Error generating QR code buffer:', error);
    throw error;
  }
};

/**
 * Generate unique session ID
 */
const generateSessionId = () => {
  return crypto.randomUUID();
};

/**
 * Generate random scanner ID
 */
const generateScannerId = (boothId) => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${boothId}-${timestamp}-${randomStr}`;
};

/**
 * Encrypt data (for additional security)
 */
const encryptData = (data, key) => {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw error;
  }
};

/**
 * Decrypt data
 */
const decryptData = (encryptedData, key) => {
  try {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw error;
  }
};

module.exports = {
  generateQRCodeDataUrl,
  generateQRCodeBuffer,
  generateSessionId,
  generateScannerId,
  encryptData,
  decryptData
};
