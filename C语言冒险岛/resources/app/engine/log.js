'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const LOG_DIR = path.join(os.tmpdir(), 'C-Adventure-Island-Update');
const LOG_FILE = path.join(LOG_DIR, 'update_log.txt');
function ensure() { try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch (e) {} }
function write(level, msg) {
  ensure();
  const line = `[${new Date().toISOString()}] [${level}] ${msg}\r\n`;
  try { fs.appendFileSync(LOG_FILE, line, 'utf8'); } catch (e) {}
}
module.exports = {
  LOG_FILE,
  info: (m) => write('INFO', m),
  warn: (m) => write('WARN', m),
  error: (m) => write('ERROR', m)
};