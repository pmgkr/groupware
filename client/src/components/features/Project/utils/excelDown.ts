import * as XLSX from 'xlsx-js-style';
import { format } from 'date-fns';
import { formatDate, normalizeAttachmentUrl } from '@/utils';
import { type AdminExpenseExcelResponse } from '@/api/admin/pexpense';

/* =======================
 *  Styles
 * ======================= */

const borderStyle = {
  top: { style: 'thin' },
  bottom: { style: 'thin' },
  left: { style: 'thin' },
  right: { style: 'thin' },
};

export const baseCellStyle = {
  font: { sz: 9, name: '맑은 고딕' },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: borderStyle,
};

export const headerCellStyle = {
  font: { sz: 10, name: '맑은 고딕', bold: true },
  alignment: { horizontal: 'center', vertical: 'center' },
  fill: { fgColor: { rgb: 'FAFAFA' } },
  border: borderStyle,
};

const amountCellStyle = {
  font: { sz: 10, name: '맑은 고딕' },
  alignment: { horizontal: 'right', vertical: 'center' },
  numFmt: '#,##0',
  border: borderStyle,
};

const linkCellStyle = {
  font: {
    sz: 8,
    name: '맑은 고딕',
    color: { rgb: '0563C1' },
    underline: true,
  },
  alignment: { wrapText: true, horizontal: 'center', vertical: 'center' },
  border: borderStyle,
};

/* =======================
 *  Columns
 * ======================= */

const columns = [
  'SEQ.',
  'EXP#',
  'Project#',
  'Subject',
  'User Name',
  'Manager',
  'Type',

  'Account',
  'Bank Code',
  'Bank Name',
  'Account#',

  'Amount',
  'Tax',
  'Total',

  'Reg@',
  'Approved@',
  '입금신청일자',
  '지급예정일자',

  'Item Name',
  'Item Amount',
  'Item Tax',
  'Item Total',
  'Item Remark',

  'File',
];

const HEADER_GROUPS = [
  { title: 'Basic Information', start: 0, end: 6 },
  { title: 'Account Information', start: 7, end: 10 },
  { title: 'Total Amount', start: 11, end: 13 },
  { title: 'Registration@', start: 14, end: 17 },
  { title: 'Claimed Item', start: 18, end: 23 },
];

// header만 병합 (item은 조건부)
const HEADER_MERGE_COLS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

/* =======================
 *  Header builders
 * ======================= */

function buildGroupHeaderRow() {
  const row: Record<string, any> = {};
  columns.forEach((c) => (row[c] = { v: '', s: headerCellStyle }));
  HEADER_GROUPS.forEach(({ title, start }) => {
    row[columns[start]] = { v: title, s: headerCellStyle };
  });
  return row;
}

function buildHeaderRow() {
  const row: Record<string, any> = {};
  columns.forEach((c) => (row[c] = { v: c, s: headerCellStyle }));
  return row;
}

/* =======================
 *  Rows + Merge builder
 * ======================= */
function buildTitleRow(title: string) {
  const row: Record<string, any> = {};

  columns.forEach((c, idx) => {
    row[c] =
      idx === 0
        ? {
            v: title,
            s: {
              font: { sz: 15, bold: true },
              alignment: { horizontal: 'left', vertical: 'center' },
            },
          }
        : { v: '', s: {} };
  });

  return row;
}

function buildTitleText(params: { year?: number; status?: string; is_matched?: string }) {
  const parts: string[] = [];

  if (params.status) parts.push(`${params.status}`);
  if (params.is_matched) {
    const matched = params.is_matched.split(',');
    if (matched.includes('Y')) parts.push('견적서 매칭');
    if (matched.includes('N')) parts.push('견적서 미매칭');
  }

  return `Project Expense – ${parts.join(', ')}`;
}

function buildRows(data: AdminExpenseExcelResponse[]) {
  const rows: Record<string, any>[] = [];
  const merges: XLSX.Range[] = [];

  let excelRow = 0; // data row index (header 제외)

  data.forEach(({ header, items }) => {
    const headerStartRow = excelRow;

    items.forEach((item) => {
      const itemStartRow = excelRow;

      const attachments = item.attachments && item.attachments.length > 0 ? item.attachments : [null];

      // ⭐ attachment가 2개 이상일 때 병합
      const shouldMergeItem = attachments.length > 1;

      const itemCount = items.length;
      const seqDisplay = `${header.seq} (${itemCount})`;

      attachments.forEach((att) => {
        rows.push({
          'SEQ.': seqDisplay,
          'EXP#': {
            v: header.exp_id,
            l: { Target: `https://portal.pmgasia.co.kr/project/${header.project_id}/expense/${header.seq}` },
            s: linkCellStyle,
          },
          'Project#': {
            v: header.project_id,
            l: { Target: `https://portal.pmgasia.co.kr/project/${header.project_id}` },
            s: linkCellStyle,
          },
          Subject: header.el_title ?? '',
          'User Name': header.user_nm,
          Manager: header.manager_nm,
          Type: header.el_type,

          Account: header.account_name,
          'Bank Code': header.bank_code,
          'Bank Name': header.bank_name,
          'Account#': header.bank_account,

          Amount: { v: Number(header.el_amount), t: 'n', s: amountCellStyle },
          Tax: { v: Number(header.el_tax), t: 'n', s: amountCellStyle },
          Total: { v: Number(header.el_total), t: 'n', s: amountCellStyle },

          'Reg@': formatDate(header.wdate),
          'Approved@': formatDate(header.ddate),
          입금신청일자: formatDate(header.edate),
          지급예정일자: formatDate(header.cdate),

          // item (병합 조건부)
          'Item Name': item.ei_title,
          'Item Amount': { v: Number(item.ei_amount), t: 'n', s: amountCellStyle },
          'Item Tax': { v: Number(item.ei_tax), t: 'n', s: amountCellStyle },
          'Item Total': { v: Number(item.ei_total), t: 'n', s: amountCellStyle },
          'Item Remark': item.remark ?? '',

          File: att
            ? {
                v: att.ea_fname,
                l: { Target: normalizeAttachmentUrl(att.ea_url) },
                s: linkCellStyle,
              }
            : '',
        });

        excelRow++;
      });

      const itemEndRow = excelRow - 1;

      // 🔹 Case B: item 병합
      if (shouldMergeItem && itemEndRow > itemStartRow) {
        [18, 19, 20, 21, 22].forEach((c) => {
          merges.push({
            s: { r: itemStartRow, c },
            e: { r: itemEndRow, c },
          });
        });
      }
    });

    const headerEndRow = excelRow - 1;

    // 🔹 header 병합 (항상)
    if (headerEndRow > headerStartRow) {
      HEADER_MERGE_COLS.forEach((c) => {
        merges.push({
          s: { r: headerStartRow, c },
          e: { r: headerEndRow, c },
        });
      });
    }
  });

  return { rows, merges };
}

/* =======================
 *  Excel Download
 * ======================= */

export function downloadExpenseExcel(data: AdminExpenseExcelResponse[], params: { status?: string; is_matched?: string }) {
  if (!data || data.length === 0) return;

  const { rows, merges } = buildRows(data);

  const titleText = buildTitleText({
    status: params.status,
    is_matched: params.is_matched,
  });

  const ws = XLSX.utils.json_to_sheet([buildTitleRow(titleText), {}, buildGroupHeaderRow(), buildHeaderRow(), ...rows], {
    skipHeader: true,
  });

  ws['!merges'] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: columns.length - 1 },
    },

    // group header
    ...HEADER_GROUPS.map((g) => ({
      s: { r: 2, c: g.start },
      e: { r: 2, c: g.end },
    })),

    // data merges (+4: group + header)
    ...merges.map((m) => ({
      s: { r: m.s.r + 4, c: m.s.c },
      e: { r: m.e.r + 4, c: m.e.c },
    })),
  ];

  // base style 적용
  Object.keys(ws).forEach((addr) => {
    if (addr.startsWith('!')) return;

    const cell = ws[addr];
    const rowIndex = XLSX.utils.decode_cell(addr).r;

    if (rowIndex === 0) return;

    cell.s = {
      ...baseCellStyle,
      ...(cell.s || {}),
    };
  });

  ws['!rows'] = [
    { hpt: 30 }, // Row 1 (A1 타이틀)
    { hpt: 10 },
  ];

  // column width
  ws['!cols'] = [
    { wch: 10 }, // SEQ
    { wch: 12 }, // EXP#
    { wch: 10 }, // Project#
    { wch: 30 }, // Subject
    { wch: 12 }, // User Name
    { wch: 12 }, // Manager
    { wch: 16 }, // Type
    { wch: 20 }, // Account
    { wch: 10 }, // Bank Code
    { wch: 14 }, // Bank Name
    { wch: 20 }, // Account#
    { wch: 14 }, // Amount
    { wch: 12 }, // Tax
    { wch: 14 }, // Total
    { wch: 14 }, // Reg@
    { wch: 14 }, // Approved@
    { wch: 16 }, // 입금신청일자
    { wch: 16 }, // 지급예정일자
    { wch: 30 }, // Item Name
    { wch: 14 }, // Item Amount
    { wch: 14 }, // Item Tax
    { wch: 14 }, // Item Total
    { wch: 30 }, // Item Remark
    { wch: 36 }, // File
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Project Expense');

  XLSX.writeFile(wb, `ProjectExpense_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
}
