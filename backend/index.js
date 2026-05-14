const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const cfg = require('./config');
const LocalProvider = require('./providers/local');

// Open a native OS folder-picker dialog on the server machine.
// Returns the selected path, or an empty string if cancelled.
function pickFolderDialog() {
  return new Promise((resolve, reject) => {
    const cmd = [
      '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8',
      'Add-Type -AssemblyName System.Windows.Forms',
      '$d = New-Object System.Windows.Forms.FolderBrowserDialog',
      "$d.Description = 'Select Eagle Library Folder (.library)'",
      "$d.ShowNewFolderButton = $false",
      "if ($d.ShowDialog() -eq 'OK') { Write-Output $d.SelectedPath }",
    ].join('; ');

    execFile('powershell', ['-NoProfile', '-Command', cmd], { encoding: 'buffer' }, (err, stdout) => {
      if (err) return reject(new Error(err.message));
      resolve(stdout.toString('utf8').trim());
    });
  });
}

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

// Open the native folder-picker dialog on the server and return the chosen path.
app.get('/api/config/pick-folder', async (req, res) => {
  try {
    const selected = await pickFolderDialog();
    if (!selected) return res.json({ cancelled: true });
    res.json({ path: selected });
  } catch (e) {
    res.status(500).json({ error: `无法打开文件夹选择器：${e.message}` });
  }
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

// ── Frontend static files (Docker / production) ────────────────────────────
const STATIC_DIR = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(STATIC_DIR)) {
  app.use(express.static(STATIC_DIR));
  app.get('*', (_req, res) => res.sendFile(path.join(STATIC_DIR, 'index.html')));
}

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Eagle viewer running on http://0.0.0.0:${PORT}`);
  console.log(`Library: ${cfg.getLibraryPath()}`);
});
