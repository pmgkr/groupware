export function isNum(obj: string | number): boolean {
  return !isNaN(Number(obj)); // 숫자면 true, 문자면 false
}
