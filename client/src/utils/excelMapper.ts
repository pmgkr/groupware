/** (1) Expense Mapping
 * Excel JSON 데이터를 ExpenseRegister 폼 구조로 변환 (가맹점명 자동 인식 버전)
 * @param excelData XLSX.utils.sheet_to_json() 결과
 * @returns ExpenseRegister용 items 배열
 */
export function mapExcelToExpenseItems(excelData: any[]): any[] {
  if (!Array.isArray(excelData) || excelData.length < 2) return [];

  // ✅ 첫 번째 행을 헤더로 간주
  const headerRow = excelData[0];
  const dataRows = excelData.slice(1);

  // ✅ 컬럼명 자동 인식 매핑
  const headerMap: Record<string, string> = {};

  for (const [key, value] of Object.entries(headerRow)) {
    const label = String(value).trim();

    if (label === '매입일자') headerMap.date = key;
    else if (label === '가맹점명')
      headerMap.title = key; // ✅ 정확히 일치하는 경우
    else if (label === '매입금액') headerMap.price = key;
    else if (label === '승인번호') headerMap.number = key;
  }

  if (!headerMap.date) {
    const dateKey = Object.entries(headerRow).find(([_, v]) => String(v).includes('매입일자'));
    if (dateKey) headerMap.date = dateKey[0];
  }

  if (!headerMap.title) {
    const titleKey = Object.entries(headerRow).find(([_, v]) => String(v).includes('가맹점명'));
    if (titleKey) headerMap.title = titleKey[0];
  }

  if (!headerMap.price) {
    const priceKey = Object.entries(headerRow).find(([_, v]) => String(v).includes('매입금액'));
    if (priceKey) headerMap.price = priceKey[0];
  }

  if (!headerMap.number) {
    const numKey = Object.entries(headerRow).find(([_, v]) => String(v).includes('승인번호'));
    if (numKey) headerMap.number = numKey[0];
  }

  // ✅ 가맹점명 fallback (자동 감지 실패 시 __EMPTY_3 기본값 사용)
  if (!headerMap.title) {
    const maybeTitleKey = Object.keys(headerRow).find((key) => key.toLowerCase().includes('empty_3'));
    headerMap.title = maybeTitleKey ?? '__EMPTY_3';
  }

  // ✅ 데이터 행 변환
  const mapped = dataRows
    .map((row) => {
      const rawDate = row[headerMap.date] || '';
      const cleanDate = rawDate ? rawDate.replace(/\./g, '-').replace(/,/g, '').trim() : '';

      const rawPrice = String(row[headerMap.price] || '0').replace(/,/g, '');
      const price = Number(rawPrice) || 0;

      const tax = 0; // 항상 0으로 고정
      const total = price + tax;

      return {
        type: '', // 사용자가 직접 선택
        title: String(row[headerMap.title] || '').trim(),
        number: String(row[headerMap.number] || ''),
        date: cleanDate,
        price: String(price),
        tax: String(tax),
        total: String(total),
        pro_id: null,
        attachments: [],
      };
    })
    // ✅ 매입금액이 0이거나 title이 비어 있는 행은 제외
    .filter((item) => Number(item.price) > 0 && item.title !== '');

  return mapped;
}

/** (2) Estimate Mapping
 * Excel JSON → 견적서 아이템 매핑 (최종 완성본)
 * - Title / Item / Sub total / Discount / Grand Total / Agency Fee
 * - Amount는 반올림 처리
 */
export function mapExcelToQuotationItems(excelData: any[]): any[] {
  if (!Array.isArray(excelData) || excelData.length === 0) return [];

  // ----------------------------------------
  // 1) Header Key 자동 수집
  // ----------------------------------------
  const allKeys = new Set<string>();
  for (const row of excelData) {
    Object.keys(row).forEach((k) => !k.startsWith('__') && allKeys.add(k));
  }

  // normalize
  const normalize = (label: any) =>
    String(label)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[()]/g, '')
      .replace(/[^a-z0-9]/g, '');

  // ----------------------------------------
  // 2) HeaderMap 자동 매핑
  // ----------------------------------------
  const headerMap: Record<string, string> = {};

  for (const key of allKeys) {
    const norm = normalize(key);
    if (norm === 'item') headerMap.item = key;
    else if (norm === 'unitprice') headerMap.unit = key;
    else if (norm === 'qty' || norm === 'quantity') headerMap.qty = key;
    else if (norm === 'amount' || norm === 'amountkrw') headerMap.amount = key;
    else if (norm === 'remarks' || norm === 'remark') headerMap.remarks = key;
  }

  if (!headerMap.item) {
    const fallbackItem = [...allKeys].find((k) => normalize(k) === 'item');
    if (fallbackItem) headerMap.item = fallbackItem;
  }

  if (!headerMap.item) {
    console.warn('❌ Item 컬럼이 없어 매핑할 수 없습니다.');
    return [];
  }

  const result: any[] = [];

  // ----------------------------------------
  // 3) Row 변환 시작
  // ----------------------------------------
  for (const row of excelData) {
    const itemRaw = row[headerMap.item];
    if (!itemRaw) continue;

    const item = String(itemRaw).trim();
    const depth = (String(itemRaw).match(/^\s+/)?.[0].length || 0) / 2;

    const unitRaw = headerMap.unit ? row[headerMap.unit] : undefined;
    const qtyRaw = headerMap.qty ? row[headerMap.qty] : undefined;
    const amountRaw = headerMap.amount ? row[headerMap.amount] : undefined;
    const remarksRaw = headerMap.remarks ? row[headerMap.remarks] : undefined;

    // ----------------------------------------
    // 4) parsedUnit: 단가 원본
    // ----------------------------------------
    const parsedUnit = unitRaw !== undefined ? Number(String(unitRaw).replace(/,/g, '')) : undefined;

    // qty
    const qty = qtyRaw !== undefined ? Number(String(qtyRaw).replace(/,/g, '')) : 0;

    // amount
    const rawAmount = amountRaw !== undefined ? Number(String(amountRaw).replace(/,/g, '')) : 0;

    const amount = Math.round(rawAmount);
    const remarks = remarksRaw ? String(remarksRaw).trim() : '';

    const isTotalButNotLast = /total/i.test(item) && !/grand\s*total/i.test(item) && row !== excelData[excelData.length - 1];

    // ----------------------------------------
    // Sub Total
    // ----------------------------------------
    if (/^sub\s*total/i.test(item) || isTotalButNotLast) {
      result.push({
        type: 'subtotal',
        label: item,
        amount,
      });
      continue;
    }

    // ----------------------------------------
    // Grand Total
    // ----------------------------------------
    const isLastRow = row === excelData[excelData.length - 1]; // 배열의 마지막 항목인 지
    const isExplicitGrand = /grand\s*total/i.test(item); // 항목값이 grand total을 포함하고 있는 지
    const isImplicitGrand = /^total$/i.test(item) && isLastRow; // grand total이 아닌 'total'을 포함하며 마지막 항목인 경우 grand total 타입으로 인정

    if (isExplicitGrand || isImplicitGrand) {
      result.push({
        type: 'grandtotal',
        label: 'Grand Total',
        amount,
      });
      continue;
    }

    // ----------------------------------------
    // ⭐ Agency Fee 판정
    // ----------------------------------------
    const hasFeeKeyword = /fee/i.test(item) || /agency\s*fee/i.test(item); // 항목값이 fee 혹은 agency fee를 포함하고 있는 지
    const hasRealValue = (parsedUnit !== undefined && parsedUnit !== 0) || (amountRaw !== undefined && rawAmount !== 0);
    const isAgencyFee = hasFeeKeyword && hasRealValue && !/^sub\s*total/i.test(item) && !/grand\s*total/i.test(item);

    // ----------------------------------------
    // ⭐ 5) unit_price 확정 (agency_fee인지 여부에 따라 분기)
    // ----------------------------------------
    let unit_price = 0;

    if (isAgencyFee) {
      // 🔥 단가가 0~1 사이면 → 퍼센트형 → 소수 그대로
      if (parsedUnit !== undefined && parsedUnit > 0 && parsedUnit < 1) {
        unit_price = parsedUnit;
      } else {
        // 🔥 1 이상이면 → KRW → 반올림
        unit_price = parsedUnit !== undefined ? Math.round(parsedUnit) : 0;
      }
    } else {
      // 일반 item → 반올림
      unit_price = parsedUnit !== undefined ? Math.round(parsedUnit) : 0;
    }

    // ----------------------------------------
    // Agency Fee Row 생성
    // ----------------------------------------
    if (isAgencyFee) {
      result.push({
        type: 'agency_fee',
        label: item,
        unit_price,
        amount,
        remarks,
        depth,
      });
      continue;
    }

    // ----------------------------------------
    // Discount (Item + Amount만 있음)
    // ----------------------------------------
    const hasAmount = amountRaw !== undefined && rawAmount !== 0;
    const hasNoUnit = parsedUnit === undefined || parsedUnit === 0;
    const hasNoQty = qty === 0;

    const isDiscount = hasAmount && hasNoUnit && hasNoQty && !/^sub\s*total/i.test(item) && !/grand\s*total/i.test(item);

    if (isDiscount) {
      result.push({
        type: 'discount',
        label: item,
        amount,
      });
      continue;
    }

    // ----------------------------------------
    // Title
    // ----------------------------------------
    const noAmount = rawAmount === 0;
    const isTitle = (parsedUnit === undefined || parsedUnit === 0) && qty === 0 && noAmount;

    if (isTitle) {
      result.push({
        type: 'title',
        item,
        depth,
      });
      continue;
    }

    // ----------------------------------------
    // 일반 Item
    // ----------------------------------------
    result.push({
      type: 'item',
      item,
      unit_price,
      qty,
      amount,
      remarks,
      depth,
    });
  }

  return result;
}
