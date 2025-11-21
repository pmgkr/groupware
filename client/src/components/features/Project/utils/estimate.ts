// utils/quotation.ts
// 금액 계산에 포함시킬 item 타입들
export const AMOUNT_ITEM_TYPES = ['item', 'agency_fee', 'discount'] as const;

// 타입 가드 함수
export function isAmountItem<T extends { type: string }>(
  f: T
): f is T & {
  amount: number;
  type: 'item' | 'agency_fee' | 'discount';
} {
  return ['item', 'agency_fee', 'discount'].includes(f.type);
}
