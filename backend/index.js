const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cfg = require('./config');
const LocalProvider = require('./providers/local');

const PORT = 3000;

// Provider is re-created whenever the library path changes at runtime
let provider = new LocalProvider(cfg.getLibraryPath());

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
  res.json({ libraryPath: provider.libraryPath });
});

app.post('/api/config/library', (req, res) => {
  const { libraryPath } = req.body;
  if (!libraryPath || typeof libraryPath !== 'string') {
    return res.status(400).json({ error: 'libraryPath required' });
  }

  // Validate it looks like an Eagle library
  const metaFile = path.join(libraryPath, 'metadata.json');
  if (!fs.existsSync(metaFile)) {
    return res.status(400).json({
      error: '路径无效：找不到 metadata.json，请确认这是一个 Eagle 图库文件夹',
    });
  }

  cfg.setLibraryPath(libraryPath);
  provider = new LocalProvider(libraryPath); // swap provider, cache cleared automatically
  console.log(`[config] library path updated → ${libraryPath}`);
  res.json({ ok: true, libraryPath });
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Eagle viewer running on http://0.0.0.0:${PORT}`);
  console.log(`Library: ${cfg.getLibraryPath()}`);
});
