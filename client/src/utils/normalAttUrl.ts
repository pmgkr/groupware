export function normalizeAttachmentUrl(url?: string) {
  if (!url) return '';
  return url.endsWith('/download') ? url.replace(/\/download$/, '') : url;
}
