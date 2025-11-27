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

export function recalcAmount(unit_price: number, qty: number) {
  return Number(unit_price) * Number(qty);
}

export function calcSubtotal(rows: EstimateRow[], startIndex: number) {
  let sum = 0;

  for (let i = startIndex + 1; i < rows.length; i++) {
    const row = rows[i];

    // 다음 subtotal 또는 grandtotal 만나면 그룹 종료
    if (row.ei_type === 'subtotal' || row.ei_type === 'grandtotal') break;

    if (row.ei_type === 'item' || row.ei_type === 'agency_fee') {
      sum += Number(row.amount || 0);
    }

    if (row.ei_type === 'discount') {
      sum += Number(row.amount || 0); // discount는 음수 처리됨
    }
  }

  return sum;
}

export function calcGrandTotal(rows: EstimateRow[]) {
  return rows.reduce((acc, row) => {
    if (row.ei_type !== 'subtotal' && row.ei_type !== 'grandtotal') {
      return acc + Number(row.amount || 0);
    }
    return acc;
  }, 0);
}

export function calcGrandTotalExp(rows: EstimateRow[]) {
  return rows.reduce((acc, row) => acc + Number(row.exp_cost || 0), 0);
}

export function recalcTotals(items: any[]) {
  // 1) Subtotal 계산
  items.forEach((row, idx) => {
    if (row.ei_type === 'subtotal') {
      let sum = 0;

      for (let i = idx - 1; i >= 0; i--) {
        const prev = items[i];
        if (prev.ei_type === 'subtotal') break;

        if (['item', 'agency_fee', 'discount'].includes(prev.ei_type)) {
          const val = prev.amount === '-' || prev.amount === '' || prev.amount == null ? 0 : Number(prev.amount);

          if (!isNaN(val)) sum += val;
        }
      }

      row.amount = sum;
    }
  });

  // 2) Grand Total 계산
  let grand = 0;
  let exp = 0;

  items.forEach((row) => {
    if (['item', 'agency_fee', 'discount'].includes(row.ei_type)) {
      const a = row.amount === '-' || row.amount === '' || row.amount == null ? 0 : Number(row.amount);
      const e = row.exp_cost === '-' || row.exp_cost === '' || row.exp_cost == null ? 0 : Number(row.exp_cost);

      if (!isNaN(a)) grand += a;
      if (!isNaN(e)) exp += e;
    }
  });

  const gIdx = items.findIndex((r) => r.ei_type === 'grandtotal');
  if (gIdx !== -1) {
    items[gIdx].amount = grand;
    items[gIdx].exp_cost = exp;
  }

  return items;
}
