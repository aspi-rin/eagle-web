const express = require('express');
const cors = require('cors');
const LocalProvider = require('./providers/local');

const LIBRARY_PATH = 'G:/我的云端硬盘/Eagle.G.Rin.library';
const PORT = 3000;

const provider = new LocalProvider(LIBRARY_PATH);
const app = express();

app.use(cors());

app.get('/api/folders', (req, res) => {
  try {
    res.json(provider.getFolders());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/images', (req, res) => {
  const { folderId } = req.query;
  if (!folderId) return res.status(400).json({ error: 'folderId required' });
  try {
    res.json(provider.getImages(folderId));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Eagle viewer running on http://0.0.0.0:${PORT}`);
  console.log(`Library: ${LIBRARY_PATH}`);
});
