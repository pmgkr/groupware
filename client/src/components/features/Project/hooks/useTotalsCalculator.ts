import { useEffect } from 'react';
import type { UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import type { EstimateRow } from '@/api';
import { calculateTotals } from '../utils/estimate';

interface UseTotalsCalculatorProps {
  debouncedItems: EstimateRow[];
  setValue: UseFormSetValue<any>;
}

export function useTotalsCalculator({ debouncedItems, setValue }: UseTotalsCalculatorProps) {
  useEffect(() => {
    if (!Array.isArray(debouncedItems) || debouncedItems.length === 0) return;

    let groupAmount = 0; // subtotal 그룹
    let groupExpCost = 0;

    let totalAmount = 0; // grandtotal 전체 합계
    let totalExpCost = 0;

    debouncedItems.forEach((row, idx) => {
      const type = row.ei_type;

      if (type === 'item' || type === 'agency_fee') {
        const amt = Number(row.amount || 0);
        const exp = Number(row.exp_cost || 0);

        groupAmount += amt;
        groupExpCost += exp;

        totalAmount += amt;
        totalExpCost += exp;
      }

      if (type === 'discount') {
        // '-' 단독 입력은 계산하지 않음
        if (row.amount === '-' || row.amount === '' || row.amount === null) return;

        const amt = Number(row.amount || 0);
        const exp = Number(row.exp_cost || 0);

        groupAmount += amt;
        groupExpCost += exp;

        totalAmount += amt;
        totalExpCost += exp;
      }

      if (type === 'subtotal') {
        setValue(`items.${idx}.amount`, groupAmount, { shouldDirty: false });
        setValue(`items.${idx}.exp_cost`, groupExpCost, { shouldDirty: false });

        groupAmount = 0;
        groupExpCost = 0;
      }

      if (type === 'grandtotal') {
        setValue(`items.${idx}.amount`, totalAmount, { shouldDirty: false });
        setValue(`items.${idx}.exp_cost`, totalExpCost, { shouldDirty: false });
      }
    });
  }, [debouncedItems, setValue]);
}
