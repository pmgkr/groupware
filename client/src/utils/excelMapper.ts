/**
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
        pro_id: '',
        attachments: [],
      };
    })
    // ✅ 매입금액이 0이거나 title이 비어 있는 행은 제외
    .filter((item) => Number(item.price) > 0 && item.title !== '');

  return mapped;
}

/**
 * Excel JSON → 견적서 아이템 매핑 (완전체 + Title Row 처리)
 */
export function mapExcelToQuotationItems(excelData: any[]): any[] {
  if (!Array.isArray(excelData) || excelData.length === 0) return [];

  // ----------------------------------------
  // 1) 모든 Row의 key를 모아 Header 후보 만들기
  // ----------------------------------------
  const allKeys = new Set<string>();
  for (const row of excelData) {
    Object.keys(row).forEach((k) => !k.startsWith('__') && allKeys.add(k));
  }

  // ----------------------------------------
  // 2) normalize 함수
  // ----------------------------------------
  const normalize = (label: any) =>
    String(label)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[()]/g, '')
      .replace(/[^a-z0-9]/g, '');

  // ----------------------------------------
  // 3) headerMap 자동 매핑
  // ----------------------------------------
  const headerMap: Record<string, string> = {};

  for (const key of allKeys) {
    const norm = normalize(key);

    if (norm === 'item') headerMap.item = key;
    else if (norm === 'unitprice') headerMap.unit = key;
    else if (norm === 'qty' || norm === 'quantity') headerMap.qty = key;
    else if (norm === 'amountkrw' || norm === 'amount') headerMap.amount = key;
    else if (norm === 'remarks' || norm === 'remark') headerMap.remarks = key;
  }

  if (!headerMap.item) {
    const maybeItem = [...allKeys].find((k) => normalize(k) === 'item');
    if (maybeItem) headerMap.item = maybeItem;
  }

  if (!headerMap.item) {
    console.warn('❌ Item 컬럼이 없어 매핑할 수 없습니다.');
    return [];
  }

  // ----------------------------------------
  // 4) Row 변환
  // ----------------------------------------
  const result: any[] = [];

  for (const row of excelData) {
    const itemRaw = row[headerMap.item];
    if (!itemRaw) continue;

    const item = String(itemRaw).trim();

    const depth = (String(itemRaw).match(/^\s+/)?.[0].length || 0) / 2;

    const unitRaw = headerMap.unit ? row[headerMap.unit] : undefined;
    const qtyRaw = headerMap.qty ? row[headerMap.qty] : undefined;
    const amountRaw = headerMap.amount ? row[headerMap.amount] : undefined;
    const remarksRaw = headerMap.remarks ? row[headerMap.remarks] : undefined;

    const unit_price = unitRaw !== undefined ? Number(String(unitRaw).replace(/,/g, '')) : 0;
    const qty = qtyRaw !== undefined ? Number(String(qtyRaw).replace(/,/g, '')) : 0;
    const rawAmount = amountRaw !== undefined ? Number(String(amountRaw).replace(/,/g, '')) : 0; // 금액 반올림 적용
    const amount = Math.round(rawAmount);
    const remarks = remarksRaw ? String(remarksRaw).trim() : '';

    // ----------------------------------------
    // 5) Sub Total
    // ----------------------------------------
    if (/^sub\s*total/i.test(item)) {
      result.push({
        type: 'subtotal',
        label: item,
        amount,
      });
      continue;
    }

    // ----------------------------------------
    // 6) Grand Total
    // ----------------------------------------
    if (/grand\s*total/i.test(item)) {
      result.push({
        type: 'grandtotal',
        label: item,
        amount,
      });
      continue;
    }

    // ----------------------------------------
    // 7) Title Row 조건
    //    (item만 있고 숫자값 없음)
    // ----------------------------------------
    const noUnit = unitRaw === undefined || unit_price === 0;
    const noQty = qtyRaw === undefined || qty === 0;
    const noAmount = amountRaw === undefined || amount === 0;
    const hasOnlyItem = noUnit && noQty && noAmount;

    if (hasOnlyItem) {
      result.push({
        type: 'title',
        item,
        depth,
      });
      continue;
    }

    // ----------------------------------------
    // 8) 일반 Item Row
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
