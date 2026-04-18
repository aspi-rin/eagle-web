# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Eagle Web Viewer — a local web viewer for [Eagle](https://eagle.cool/) image libraries. It reads an Eagle `.library` folder directly from disk and serves its contents via a browser UI.

## Development

Two separate processes must run concurrently:

```bash
# Backend (Express, port 3000) — from /backend
npm run dev        # uses node --watch for auto-reload
npm start          # production, no auto-reload

# Frontend (Vite dev server, port 5173) — from /frontend
npm run dev
npm run build      # output to /frontend/dist
```

Vite proxies `/api/*` to `http://localhost:3000`, so both servers must be running for the UI to work.

## Architecture

### Backend (`/backend`)

- `index.js` — Express entry point. Defines three routes: `GET /api/folders`, `GET /api/images`, `GET /api/file/:id/:type`.
- `providers/local.js` — `LocalProvider` class. All library access goes through this class. It reads directly from the Eagle library's file structure on disk:
  - `<library>/metadata.json` — top-level library metadata, contains the full `folders` tree (nested via `children` arrays).
  - `<library>/images/<id>.info/metadata.json` — per-image metadata. Each image's `folders` field is an array of folder IDs it belongs to.
  - `<library>/images/<id>.info/<name>.<ext>` — original file.
  - `<library>/images/<id>.info/<name>_thumbnail.png` — thumbnail.

The library path is hardcoded in `backend/index.js` as `LIBRARY_PATH`. Change this constant to point to a different Eagle library.

### Frontend (`/frontend/src`)

- `App.vue` — root layout (sidebar + content). Owns top-level state: `folders`, `selectedFolder`, `includeSubfolders`.
- `components/FolderTree.vue` — Naive UI `NTree` wrapper. Receives the raw nested `folders` array, transforms it into tree nodes, emits `select` with the full folder object on click.
- `components/ImageGrid.vue` — masonry image grid (vue-masonry-wall). Receives `folderId`, `folderName`, `includeSubfolders` as props. Watches both `folderId` and `includeSubfolders` and refetches on change. Opens PhotoSwipe lightbox on click.
- `api/index.js` — thin fetch wrappers: `getFolders()`, `getImages(folderId, includeSubfolders)`, `thumbnailUrl(id)`, `originalUrl(id)`.

### Data flow

```
FolderTree → (select event) → App.vue → (props) → ImageGrid → api/index.js → /api/images
```

`includeSubfolders` state lives in `App.vue` and is passed down to `ImageGrid` via props / `update:includeSubfolders` emit.

When `includeSubfolders` is true, `LocalProvider._collectFolderIds()` does a BFS over the folder tree to collect the target folder's ID plus all descendant IDs, then filters images against that set.

## Adding a New Provider

To support a remote or alternative Eagle source, create a new class in `backend/providers/` implementing the same interface as `LocalProvider`:

- `getFolders()` → nested folder array
- `getImages(folderId, includeSubfolders)` → image metadata array
- `getMeta(id)` → single image metadata object
- `pipeFile(id, type, res)` → streams the file to the Express response
