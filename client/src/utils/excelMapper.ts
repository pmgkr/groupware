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
 * Excel JSON → 견적서 아이템 매핑
 * Sub Total / Grand Total은 별도 타입으로 분리
 */
export function mapExcelToQuotationItems(excelData: any[]): any[] {
  if (!Array.isArray(excelData)) return [];

  const headerRow = excelData[0] ?? {};
  const headerMap: Record<string, string> = {};
  // 헤더 정규화를 위한 함수
  const normalize = (label: any) =>
    String(label)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '') // 모든 공백 제거
      .replace(/[()]/g, '') // 괄호 제거
      .replace(/[^a-z0-9]/g, ''); // 특수문자 제거

  for (const [key, value] of Object.entries(headerRow)) {
    const norm = normalize(value);

    if (norm === 'item') headerMap.item = key;
    else if (norm === 'unitprice')
      headerMap.unit = key; // Unit price
    else if (norm === 'qty' || norm === 'quantity') headerMap.qty = key;
    else if (norm === 'amountkrw' || norm === 'amount') headerMap.amount = key;
    else if (norm === 'remarks' || norm === 'remark') headerMap.remarks = key;
  }

  if (!headerMap.item) headerMap.item = 'Item';
  if (!headerMap.amount) {
    headerMap.amount = Object.keys(headerRow).find((k) => k.toLowerCase().includes('amount')) ?? '';
  }

  const rows = excelData;

  const result: any[] = [];

  for (const row of rows) {
    const itemRaw = row[headerMap.item];
    if (!itemRaw) continue;

    const item = String(itemRaw).trim();

    // indent 기반 depth 계산
    const depth = (itemRaw.match(/^\s+/)?.[0].length || 0) / 2;

    const unitRaw = row[headerMap.unit];
    const qtyRaw = row[headerMap.qty];
    const amountRaw = row[headerMap.amount];
    const remarksRaw = row[headerMap.remarks];

    const unit_price = unitRaw ? Number(String(unitRaw).replace(/,/g, '')) : 0;
    const qty = qtyRaw ? Number(String(qtyRaw).replace(/,/g, '')) : 0;
    const amount = amountRaw ? Number(String(amountRaw).replace(/,/g, '')) : 0;
    const remarks = remarksRaw ? String(remarksRaw).trim() : '';

    // ---------------------------
    // ① Sub Total 처리
    // ---------------------------
    if (/^sub\s*total/i.test(item)) {
      result.push({
        type: 'subtotal',
        label: item,
        amount,
      });
      continue;
    }

    // ---------------------------
    // ② Grand Total 처리
    // ---------------------------
    if (/grand\s*total/i.test(item)) {
      result.push({
        type: 'grandtotal',
        label: item,
        amount,
      });
      continue;
    }

    // ---------------------------
    // ③ 일반 Item 처리
    // ---------------------------
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
