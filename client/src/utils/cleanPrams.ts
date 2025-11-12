// utils/cleanParams.ts
/**
 * API 호출 시 파라미터의 값이 undefined, null, '', 빈 배열, 빈 객체로 들어가면 제거 유틸
 * @example
 * cleanParams({ a: 1, b: '', c: undefined, d: [] }) // { a: 1 }
 */
export const cleanParams = (obj: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => {
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'object' && v !== null) return Object.keys(v).length > 0;
      return v !== undefined && v !== '' && v !== null;
    })
  );
