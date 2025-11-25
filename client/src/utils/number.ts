export function isNum(obj: string | number): boolean {
  // 숫자면 true, 문자면 false
  return !isNaN(Number(obj));
}

// val이 소수면 %로 보여주는 함수
export function displayUnitPrice(val: number | string): string {
  val = typeof val === 'string' ? parseFloat(val) : val; // String이면 Number로 타입 변환

  if (typeof val === 'number' && val > 0 && val < 1) {
    return `${Math.round(val * 100)}%`; // 0.11 → "11%"
  }
  return val.toLocaleString(); // 일반 금액
}

export function formatAmount(amount: number | string | undefined): string {
  if (amount === undefined || amount === null) return '0';

  // 원화일 때 1000원 단위로 콤마 추가
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return '-';
  return numericAmount.toLocaleString('ko-KR');
}

//휴대폰 번호
export function formatPhone(phone?: string | null): string {
  if (!phone) return '-';

  // 숫자만 남기기 (010-9999-9999 → 01099999999)
  const digits = phone.replace(/\D/g, '');

  // 길이에 따라 포맷 구분
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  } else if (digits.length === 10) {
    return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  } else {
    return phone; // 형식이 다르면 원본 그대로 반환
  }
}
