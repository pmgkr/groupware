export function calcAll(items: any[]) {
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
