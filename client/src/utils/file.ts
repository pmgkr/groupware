// src/utils/file.ts
export function sanitizeFilename(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, '_');
}
