const fs = require('fs');
const path = require('path');

class LocalProvider {
  constructor(libraryPath) {
    this.libraryPath = libraryPath;
    this.imagesDir = path.join(libraryPath, 'images');
    this._allImages = null; // populated once on first use
  }

  getFolders() {
    const raw = fs.readFileSync(path.join(this.libraryPath, 'metadata.json'), 'utf-8');
    return JSON.parse(raw).folders;
  }

  // Build full image index once; subsequent calls are in-memory only
  _ensureCache() {
    if (this._allImages) return;
    console.log('[cache] building image index…');
    const dirs = fs.readdirSync(this.imagesDir);
    this._allImages = [];
    for (const dir of dirs) {
      if (!dir.endsWith('.info')) continue;
      try {
        const meta = JSON.parse(
          fs.readFileSync(path.join(this.imagesDir, dir, 'metadata.json'), 'utf-8')
        );
        if (!meta.isDeleted) {
          this._allImages.push({
            id: meta.id,
            name: meta.name,
            ext: meta.ext,
            width: meta.width,
            height: meta.height,
            tags: meta.tags,
            btime: meta.btime,
            folders: meta.folders,
          });
        }
      } catch (_) {}
    }
    console.log(`[cache] indexed ${this._allImages.length} images`);
  }

  _collectFolderIds(folderId, folderList) {
    const ids = new Set([folderId]);
    const queue = [...folderList];
    while (queue.length) {
      const folder = queue.shift();
      if (ids.has(folder.id)) {
        for (const child of folder.children || []) {
          queue.push(child);
          ids.add(child.id);
        }
      } else if ((folder.children || []).length) {
        queue.push(...folder.children);
      }
    }
    return ids;
  }

  getImages(folderId, includeSubfolders = false) {
    this._ensureCache();

    let folderIds;
    if (includeSubfolders) {
      folderIds = this._collectFolderIds(folderId, this.getFolders());
    }

    return this._allImages
      .filter((img) => {
        return includeSubfolders
          ? img.folders.some((f) => folderIds.has(f))
          : img.folders.includes(folderId);
      })
      .sort((a, b) => b.btime - a.btime)
      .map(({ folders, ...rest }) => rest);
  }

  getMeta(id) {
    const metaPath = path.join(this.imagesDir, `${id}.info`, 'metadata.json');
    return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  }

  pipeFile(id, type, res) {
    const meta = this.getMeta(id);
    const filename =
      type === 'thumbnail' ? `${meta.name}_thumbnail.png` : `${meta.name}.${meta.ext}`;
    const filePath = path.join(this.imagesDir, `${id}.info`, filename);
    res.sendFile(filePath);
  }
}

module.exports = LocalProvider;
