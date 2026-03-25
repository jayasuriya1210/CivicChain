/**
 * Logger Utility
 */

const fs = require('fs');
const path = require('path');

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

const LOG_DIR = path.join(__dirname, '../logs');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

class Logger {
  constructor(context = 'App') {
    this.context = context;
  }

  _log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] [${this.context}] ${message}`;
    
    // Console output
    const consoleColor = {
      ERROR: '\x1b[31m',    // Red
      WARN: '\x1b[33m',     // Yellow
      INFO: '\x1b[36m',     // Cyan
      DEBUG: '\x1b[35m'     // Magenta
    };

    console.log(
      `${consoleColor[level]}${logMessage}\x1b[0m`,
      data ? JSON.stringify(data, null, 2) : ''
    );

    // File output
    const logFile = path.join(LOG_DIR, `${new Date().toISOString().split('T')[0]}.log`);
    const fullMessage = data 
      ? `${logMessage} | Data: ${JSON.stringify(data)}`
      : logMessage;
    
    fs.appendFileSync(logFile, fullMessage + '\n', { encoding: 'utf-8' });
  }

  error(message, data) {
    this._log(LOG_LEVELS.ERROR, message, data);
  }

  warn(message, data) {
    this._log(LOG_LEVELS.WARN, message, data);
  }

  info(message, data) {
    this._log(LOG_LEVELS.INFO, message, data);
  }

  debug(message, data) {
    if (process.env.NODE_ENV === 'development') {
      this._log(LOG_LEVELS.DEBUG, message, data);
    }
  }
}

module.exports = Logger;
