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
