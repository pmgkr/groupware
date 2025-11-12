export function isNum(obj: string | number): boolean {
  // 숫자면 true, 문자면 false
  return !isNaN(Number(obj));
}

export function formatAmount(amount: number | string): string {
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
