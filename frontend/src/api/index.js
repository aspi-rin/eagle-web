const BASE = '/api';

export async function getFolders() {
  const res = await fetch(`${BASE}/folders`);
  if (!res.ok) throw new Error('Failed to fetch folders');
  return res.json();
}

export async function getImages(folderId) {
  const res = await fetch(`${BASE}/images?folderId=${encodeURIComponent(folderId)}`);
  if (!res.ok) throw new Error('Failed to fetch images');
  return res.json();
}

export function thumbnailUrl(id) {
  return `${BASE}/file/${id}/thumbnail`;
}

export function originalUrl(id) {
  return `${BASE}/file/${id}/original`;
}
