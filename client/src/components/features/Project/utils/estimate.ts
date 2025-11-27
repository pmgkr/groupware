// utils/quotation.ts
import { type EstimateRow } from '@/api';
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

export function calculateTotals(items: EstimateRow[]): EstimateRow[] {
  let grandAmount = 0;
  let grandExp = 0;

  let groupAmount = 0;

  return items.map((row) => {
    const type = row.ei_type;

    // 🔹 1) 숫자 변환 안전 적용
    const price = Number(row.unit_price || 0);
    const qty = Number(row.qty || 0);
    const exp = Number(row.exp_cost || 0);
    const amount = Number(row.amount || 0);

    // 🔹 item / agency_fee / discount → group 합산에 포함
    if (type === 'item' || type === 'agency_fee' || type === 'discount') {
      groupAmount += amount;
      return row;
    }

    // 🔹 subtotal → groupAmount 적용
    if (type === 'subtotal') {
      row.amount = groupAmount;
      grandAmount += groupAmount;
      groupAmount = 0;
      return row;
    }

    // 🔹 grandtotal → 전체 계산
    if (type === 'grandtotal') {
      // subtotal 유무 상관 없이 전체 금액 재계산
      const totalAmount = items
        .filter((r) => ['item', 'discount', 'agency_fee'].includes(r.ei_type))
        .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

      const totalExp = items.filter((r) => ['item'].includes(r.ei_type)).reduce((sum, r) => sum + (Number(r.exp_cost) || 0), 0);

      row.amount = totalAmount;
      row.exp_cost = totalExp;

      return row;
    }

    return row;
  });
}
