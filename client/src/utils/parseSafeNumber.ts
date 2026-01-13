// utils/number.ts
export const parseSafeNumber = (v?: string | number) => {
  if (v === '-' || v === '' || v == null) return 0;
  const n = Number(String(v).replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
};
