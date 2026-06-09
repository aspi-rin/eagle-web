require('dotenv').config();
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'config.json');
const DEFAULT_LIBRARY = process.env.EAGLE_LIBRARY || '/path/to/your/Eagle.library';

// Parse LIBRARIES_JSON env var. Format:
// [{"name":"Library 1","path":"/full/path/First.library"}, ...]
// If not set, fall back to single-library mode using EAGLE_LIBRARY_PATH / EAGLE_LIBRARY.
function parseLibraries() {
  const raw = process.env.LIBRARIES_JSON;
  if (raw) {
    try {
      const libs = JSON.parse(raw);
      if (Array.isArray(libs) && libs.length > 0) return libs;
    } catch (e) {
      console.warn('[config] LIBRARIES_JSON parse failed, falling back to single mode');
    }
  }

  // Single-library fallback: derive a name from the path
  const libPath = process.env.EAGLE_LIBRARY_PATH || DEFAULT_LIBRARY;
  const basename = path.basename(libPath);
  const name = basename.replace(/\.library$/i, '').replace(/^Eagle\.G\./, '');
  return [{ name, path: libPath }];
}

const LIBRARIES = parseLibraries();

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

function getLibraries() {
  return LIBRARIES;
}

function getLibraryIndex() {
  const data = readDisk();
  const idx = data.activeLibraryIndex;
  if (typeof idx === 'number' && idx >= 0 && idx < LIBRARIES.length) {
    return idx;
  }
  return 0;
}

function getActiveLibraryPath() {
  return LIBRARIES[getLibraryIndex()].path;
}

function setActiveLibrary(index) {
  if (index < 0 || index >= LIBRARIES.length) {
    throw new Error(`Invalid library index: ${index}`);
  }
  const data = readDisk();
  data.activeLibraryIndex = index;
  writeDisk(data);
}

module.exports = { getLibraries, getLibraryIndex, getActiveLibraryPath, setActiveLibrary };
