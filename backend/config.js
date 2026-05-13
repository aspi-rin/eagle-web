require('dotenv').config();
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'config.json');
const DEFAULT_LIBRARY = process.env.EAGLE_LIBRARY || 'G:/我的云端硬盘/Eagle.G.Rin.library';

function readDisk() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeDisk(data) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function getLibraryPath() {
  return readDisk().libraryPath || DEFAULT_LIBRARY;
}

function setLibraryPath(newPath) {
  const data = readDisk();
  data.libraryPath = newPath;
  writeDisk(data);
}

module.exports = { getLibraryPath, setLibraryPath };
