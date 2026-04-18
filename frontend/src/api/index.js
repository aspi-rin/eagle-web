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

export function thumbnailUrl(id) {
  return `${BASE}/file/${id}/thumbnail`;
}

export function originalUrl(id) {
  return `${BASE}/file/${id}/original`;
}
