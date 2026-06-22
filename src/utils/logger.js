// ============================================
// FILE: src/utils/logger.js
// ============================================

const fs = require("fs").promises;
const path = require("path");

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, "../../logs");
    this.ready = this.ensureLogDir();
  }


  async ensureLogDir() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create log directory:", error);
    }
  }

  formatMessage(level, message, meta = {}) {
    return (
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...meta,
      }) + "\n"
    );
  }

  async writeLog(filename, content) {
    try {
      const filepath = path.join(this.logDir, filename);
      await fs.appendFile(filepath, content);
    } catch (error) {
      console.error("Failed to write log:", error);
    }
  }

  info(message, meta = {}) {
    console.log(`[INFO] ${message}`, meta);
    this.writeLog("info.log", this.formatMessage("INFO", message, meta));
  }

  error(message, meta = {}) {
    console.error(`[ERROR] ${message}`, meta);
    this.writeLog("error.log", this.formatMessage("ERROR", message, meta));
  }

  warn(message, meta = {}) {
    console.warn(`[WARN] ${message}`, meta);
    this.writeLog("warn.log", this.formatMessage("WARN", message, meta));
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${message}`, meta);
      this.writeLog("debug.log", this.formatMessage("DEBUG", message, meta));
    }
  }
}

module.exports = new Logger();
