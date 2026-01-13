// utils/decimalInput.ts
// 소수점 2자리 입력 정규화 유틸 함수
export const normalizeDecimalInput = (value: string, digits = 2) => {
  let raw = value.replace(/,/g, '').replace(/[^0-9.]/g, '');

  const dotIndex = raw.indexOf('.');
  if (dotIndex !== -1) {
    const before = raw.slice(0, dotIndex);
    let after = raw.slice(dotIndex + 1);

    after = after.replace(/\./g, '').slice(0, digits);
    raw = `${before}.${after}`;
  }

  if (raw === '.') raw = '0.';
  return raw;
};
