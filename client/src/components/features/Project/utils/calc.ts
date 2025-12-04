export function calcAll(items: any[]) {
  // 1) Subtotal 계산
  items.forEach((row, idx) => {
    if (row.ei_type === 'subtotal') {
      let sum = 0;

      for (let i = idx - 1; i >= 0; i--) {
        const prev = items[i];
        if (prev.ei_type === 'subtotal') break;

        if (['item', 'agency_fee', 'discount'].includes(prev.ei_type)) {
          let val = Number(prev.amount) || 0;

          if (prev.ei_type === 'discount') {
            val = -Math.abs(val);
          }

          sum += val;
        }
      }

      row.amount = sum; // subtotal만 변경
    }
  });

  // 2) Grand Total 계산
  let grand = 0;
  let exp = 0;

  items.forEach((row) => {
    if (['item', 'agency_fee', 'discount'].includes(row.ei_type)) {
      let a = row.amount === '-' || row.amount === '' || row.amount == null ? 0 : Number(row.amount);
      let e = row.exp_cost === '-' || row.exp_cost === '' || row.exp_cost == null ? 0 : Number(row.exp_cost);

      if (row.ei_type === 'discount') {
        a = -Math.abs(row.amount); // ⬅ discount는 무조건 음수 적용
      }

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
