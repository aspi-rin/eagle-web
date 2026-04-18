const fs = require('fs');
const path = require('path');

class LocalProvider {
  constructor(libraryPath) {
    this.libraryPath = libraryPath;
    this.imagesDir = path.join(libraryPath, 'images');
  }

  getFolders() {
    const raw = fs.readFileSync(path.join(this.libraryPath, 'metadata.json'), 'utf-8');
    return JSON.parse(raw).folders;
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
    let folderIds;
    if (includeSubfolders) {
      const folders = this.getFolders();
      folderIds = this._collectFolderIds(folderId, folders);
    }

    const dirs = fs.readdirSync(this.imagesDir);
    const images = [];

    for (const dir of dirs) {
      if (!dir.endsWith('.info')) continue;
      try {
        const meta = JSON.parse(
          fs.readFileSync(path.join(this.imagesDir, dir, 'metadata.json'), 'utf-8')
        );
        const inFolder = includeSubfolders
          ? meta.folders.some((f) => folderIds.has(f))
          : meta.folders.includes(folderId);
        if (!meta.isDeleted && inFolder) {
          images.push({
            id: meta.id,
            name: meta.name,
            ext: meta.ext,
            width: meta.width,
            height: meta.height,
            tags: meta.tags,
            btime: meta.btime,
          });
        }
      } catch (_) {}
    }

    return images.sort((a, b) => b.btime - a.btime);
  }

  getMeta(id) {
    const metaPath = path.join(this.imagesDir, `${id}.info`, 'metadata.json');
    return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  }

  // pipeFile abstracts file delivery so future providers can swap in a stream
  pipeFile(id, type, res) {
    const meta = this.getMeta(id);
    const filename =
      type === 'thumbnail' ? `${meta.name}_thumbnail.png` : `${meta.name}.${meta.ext}`;
    const filePath = path.join(this.imagesDir, `${id}.info`, filename);
    res.sendFile(filePath);
  }
}

module.exports = LocalProvider;
