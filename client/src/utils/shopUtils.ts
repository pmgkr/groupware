export function formatPrice(price: number | string): string {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numericPrice)) return '-';
  return numericPrice.toLocaleString('ko-KR');
}
