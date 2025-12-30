export function normalizeElType(elType?: string | null) {
  if (!elType) return '';

  return Array.from(new Set(elType.split('|').filter(Boolean))).join('|');
}
