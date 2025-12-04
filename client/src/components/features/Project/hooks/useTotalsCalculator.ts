import { useEffect } from 'react';
import type { EstimateEditForm } from '@/api';
import { calcSubtotal, calcGrandTotal, calcGrandTotalExp } from '../utils/estimate';

interface Props {
  items: EstimateEditForm['items'];
  setValue: any;
}

/**
 * Row 이동(정렬 변경) 후에만 전체 계산을 다시 수행한다.
 */
export function useTotalsCalculator({ items, setValue }: Props) {
  useEffect(() => {
    if (!items || items.length === 0) return;

    // --------- 1) Subtotal 다시 계산 ----------
    items.forEach((row, idx) => {
      if (row.ei_type === 'subtotal') {
        const val = calcSubtotal(items, idx);
        setValue(`items.${idx}.amount`, val, { shouldDirty: false });
      }
    });

    // --------- 2) Grand Total 다시 계산 ----------
    const grandVal = calcGrandTotal(items);
    const grandExp = calcGrandTotalExp(items);

    const grandIndex = items.findIndex((r) => r.ei_type === 'grandtotal');
    if (grandIndex !== -1) {
      setValue(`items.${grandIndex}.amount`, grandVal, { shouldDirty: false });
      setValue(`items.${grandIndex}.exp_cost`, grandExp, { shouldDirty: false });
    }
  }, [items, setValue]);
}
