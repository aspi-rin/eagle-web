const BASE = '/api';

export async function getFolders() {
  const res = await fetch(`${BASE}/folders`);
  if (!res.ok) throw new Error('Failed to fetch folders');
  return res.json();
}

export async function getImages(folderId, includeSubfolders = false) {
  const params = new URLSearchParams({ folderId });
  if (includeSubfolders) params.set('includeSubfolders', 'true');
  const res = await fetch(`${BASE}/images?${params}`);
  if (!res.ok) throw new Error('Failed to fetch images');
  return res.json();
}

export async function deleteImage(id) {
  const res = await fetch(`${BASE}/images/${encodeURIComponent(id)}/delete`, {
    method: 'POST',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to delete image');
  return data;
}

export function thumbnailUrl(id) {
  return `${BASE}/file/${id}/thumbnail`;
}

export function originalUrl(id) {
  return `${BASE}/file/${id}/original`;
}

export async function getConfig() {
  const res = await fetch(`${BASE}/config`);
  if (!res.ok) throw new Error('Failed to fetch config');
  return res.json();
}

export async function getLibraries() {
  const res = await fetch(`${BASE}/libraries`);
  if (!res.ok) throw new Error('Failed to fetch libraries');
  return res.json();
}

// Switch to a library by its path
export async function selectLibrary(libraryPath) {
  const res = await fetch(`${BASE}/config/library`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ libraryPath }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to switch library');
  return data;
}
