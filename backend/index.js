const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cfg = require('./config');
const LocalProvider = require('./providers/local');

const PORT = 3000;

// Provider is re-created whenever the active library changes
let provider = new LocalProvider(cfg.getActiveLibraryPath());

const app = express();
app.use(cors());
app.use(express.json());

// ── Folders ────────────────────────────────────────────────────────────────
app.get('/api/folders', (req, res) => {
  try {
    res.json(provider.getFolders());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Images ─────────────────────────────────────────────────────────────────
app.get('/api/images', (req, res) => {
  const { folderId, includeSubfolders } = req.query;
  if (!folderId) return res.status(400).json({ error: 'folderId required' });
  try {
    res.json(provider.getImages(folderId, includeSubfolders === 'true'));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── File delivery ──────────────────────────────────────────────────────────
app.get('/api/file/:id/:type', (req, res) => {
  const { id, type } = req.params;
  if (!['original', 'thumbnail'].includes(type)) {
    return res.status(400).json({ error: 'type must be original or thumbnail' });
  }
  try {
    provider.pipeFile(id, type, res);
  } catch (e) {
    res.status(404).json({ error: 'Not found' });
  }
});

// ── Config ─────────────────────────────────────────────────────────────────
app.get('/api/config', (req, res) => {
  const activeIdx = cfg.getLibraryIndex();
  res.json({
    libraries: cfg.getLibraries(),
    activeLibraryIndex: activeIdx,
    activeLibrary: { ...cfg.getLibraries()[activeIdx], index: activeIdx },
  });
});

// List all available libraries (no side-effects)
app.get('/api/libraries', (req, res) => {
  res.json(cfg.getLibraries());
});

// Switch active library by path
app.post('/api/config/library', (req, res) => {
  const { libraryPath } = req.body;
  if (!libraryPath || typeof libraryPath !== 'string') {
    return res.status(400).json({ error: 'libraryPath required' });
  }

  // Find the library by path
  const libs = cfg.getLibraries();
  const idx = libs.findIndex((l) => l.path === libraryPath);
  if (idx === -1) {
    return res.status(400).json({
      error: '路径不在可用图库列表中，请通过 docker-compose 挂载新图库',
    });
  }

  // Validate it looks like an Eagle library
  const metaFile = path.join(libraryPath, 'metadata.json');
  if (!fs.existsSync(metaFile)) {
    return res.status(400).json({
      error: '路径无效：找不到 metadata.json，请确认这是一个 Eagle 图库文件夹',
    });
  }

  cfg.setActiveLibrary(idx);
  provider = new LocalProvider(libraryPath);
  console.log(`[config] switched to library [${idx}] → ${libraryPath}`);
  res.json({ ok: true, libraryPath, index: idx, name: libs[idx].name });
});

// ── Frontend static files (Docker / production) ────────────────────────────
const STATIC_DIR = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(STATIC_DIR)) {
  app.use(express.static(STATIC_DIR));
  app.get('*', (_req, res) => res.sendFile(path.join(STATIC_DIR, 'index.html')));
}

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Eagle viewer running on http://0.0.0.0:${PORT}`);
  console.log(`Available libraries: ${cfg.getLibraries().map(l => l.name).join(', ')}`);
  console.log(`Active library: ${cfg.getActiveLibraryPath()}`);
});
