import * as XLSX from 'xlsx-js-style';
import { format } from 'date-fns';
import type { ProjectListItem, ProjectListResponse } from '@/api/admin/project';
import { is } from 'date-fns/locale';

/* =======================
 *  Styles
 * ======================= */

const borderStyle = {
  top: { style: 'thin' },
  bottom: { style: 'thin' },
  left: { style: 'thin' },
  right: { style: 'thin' },
};

const baseCellStyle = {
  font: { sz: 9, name: '맑은 고딕' },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: borderStyle,
};

const headerCellStyle = {
  font: { sz: 10, name: '맑은 고딕', bold: true },
  alignment: { horizontal: 'center', vertical: 'center' },
  fill: { fgColor: { rgb: 'FAFAFA' } },
  border: borderStyle,
};

const amountCellStyle = {
  font: { sz: 9, name: '맑은 고딕' },
  alignment: { horizontal: 'right', vertical: 'center' },
  numFmt: '#,##0',
  border: borderStyle,
};

const summaryAmountCellStyle = {
  font: { sz: 11, name: '맑은 고딕', bold: true },
  alignment: { horizontal: 'right', vertical: 'center' },
  numFmt: '#,##0',
  border: borderStyle,
};

const linkCellStyle = {
  font: {
    sz: 9,
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
  'Project#',
  'Project Title',
  'Client',
  'Owner',
  'Team',
  'Estimated Cost', // 견적서 금액
  'Estimated Expense', // 예상 지출 금액
  'Expensed', // 실제 지출
  'Invoice Billed', // 계산서 금액
  'Net Profit', // 수익금
  'GPM(%)',
  'Status',
  'isLocked', // 프로젝트 잠금 여부
];

/* =======================
 *  Header Rows
 * ======================= */

function buildTitleRow(title: string) {
  const row: Record<string, any> = {};
  columns.forEach((c, i) => {
    row[c] =
      i === 0
        ? {
            v: title,
            s: {
              font: { sz: 20, bold: true },
              alignment: { horizontal: 'left', vertical: 'center' },
            },
          }
        : { v: '', s: {} };
  });
  return row;
}

function buildHeaderRow() {
  const row: Record<string, any> = {};
  columns.forEach((c) => {
    row[c] = { v: c, s: headerCellStyle };
  });
  return row;
}

/* =======================
 *  Data Rows
 * ======================= */

function buildRows(items: ProjectListItem[]) {
  return items.map((item) => ({
    'Project#': {
      v: item.project_id,
      l: { Target: `https://portal.pmgasia.co.kr/project/${item.project_id}` },
      s: linkCellStyle,
    },
    'Project Title': item.project_title,
    Client: item.client_nm,
    Owner: item.owner_nm,
    Team: item.team_name,

    'Estimated Cost': { v: item.est_amount ?? 0, t: 'n', s: amountCellStyle },
    'Estimated Expense': { v: item.est_budget ?? 0, t: 'n', s: amountCellStyle },
    Expensed: { v: item.exp_amount ?? 0, t: 'n', s: amountCellStyle },
    'Invoice Billed': { v: item.inv_amount ?? 0, t: 'n', s: amountCellStyle },
    'Net Profit': { v: item.netprofit ?? 0, t: 'n', s: amountCellStyle },
    'GPM(%)': item.GPM ? `${item.GPM}%` : '-',
    Status: item.project_status,
    isLocked: item.is_locked,
  }));
}

/* =======================
 *  Summary Rows
 * ======================= */

function buildSummaryRow(label: string, data: ProjectListResponse['subtotal']) {
  return {
    'Project#': {
      v: label,
      s: {
        ...baseCellStyle,
        font: { sz: 14, bold: true },
        alignment: { horizontal: 'center', vertical: 'center' },
      },
    },
    'Project Title': '',
    Client: '',
    Owner: '',
    Team: '',

    'Estimated Cost': { v: data.sum_est_amount, t: 'n', s: summaryAmountCellStyle },
    'Estimated Expense': { v: data.sum_est_budget, t: 'n', s: summaryAmountCellStyle },
    Expensed: { v: data.sum_exp_amount, t: 'n', s: summaryAmountCellStyle },
    'Invoice Billed': { v: data.sum_inv_amount, t: 'n', s: summaryAmountCellStyle },
    'Net Profit': { v: data.sum_netprofit, t: 'n', s: summaryAmountCellStyle },
    'GPM(%)': {
      v: data.avg_gpm ? `${data.avg_gpm}%` : '-',
      s: {
        ...baseCellStyle,
        font: { sz: 12, name: '맑은 고딕', bold: true },
      },
    },
    Status: '',
    isLocked: '',
  };
}

/* =======================
 *  Excel Download
 * ======================= */

export function downloadReportExcel(res: ProjectListResponse, params: { year?: string; project_status?: string }) {
  if (!res || !res.items || res.items.length === 0) return;

  const title = `Project Report ${params.year ? `- ${params.year}` : ''}`;

  const rows = [
    buildTitleRow(title),
    {},
    buildHeaderRow(),
    ...buildRows(res.items),
    {},
    buildSummaryRow('Sub Total', res.subtotal),
    buildSummaryRow('Grand Total', res.grandtotal),
  ];

  const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: true });

  const headerRowIndex = 2;
  const dataStartRowIndex = headerRowIndex + 1;
  const dataEndRowIndex = dataStartRowIndex + res.items.length - 1;

  const subTotalRowIndex = dataEndRowIndex + 2;
  const grandTotalRowIndex = dataEndRowIndex + 3;

  // 타이틀 병합
  ws['!merges'] = [
    // 타이틀 병합
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: columns.length - 1 },
    },

    // Sub Total 병합 (A~E)
    {
      s: { r: subTotalRowIndex, c: 0 },
      e: { r: subTotalRowIndex, c: 4 },
    },
    {
      s: { r: subTotalRowIndex, c: 10 },
      e: { r: subTotalRowIndex, c: 12 },
    },

    // Grand Total 병합 (A~E)
    {
      s: { r: grandTotalRowIndex, c: 0 },
      e: { r: grandTotalRowIndex, c: 4 },
    },
    {
      s: { r: grandTotalRowIndex, c: 10 },
      e: { r: grandTotalRowIndex, c: 12 },
    },
  ];

  // 기본 스타일 적용
  Object.keys(ws).forEach((addr) => {
    if (addr.startsWith('!')) return;
    const cell = ws[addr];
    const rowIndex = XLSX.utils.decode_cell(addr).r;
    if (rowIndex <= 1) return;

    cell.s = {
      ...baseCellStyle,
      ...(cell.s || {}),
    };
  });

  ws['!rows'] = ws['!rows'] ?? [];

  ws['!rows'][0] = { hpt: 40 }; // 타이틀
  ws['!rows'][1] = { hpt: 12 }; // 빈 줄
  ws['!rows'][2] = { hpt: 22 }; // 빈 줄

  // Sub / Grand Total
  ws['!rows'][subTotalRowIndex] = { hpt: 26 };
  ws['!rows'][grandTotalRowIndex] = { hpt: 26 };

  // Column Width
  ws['!cols'] = [
    { wch: 12 }, // Project#
    { wch: 40 }, // Project Title
    { wch: 20 }, // Client
    { wch: 12 }, // Owner
    { wch: 12 }, // Team
    { wch: 20 }, // Estimated Amount
    { wch: 20 }, // Estimated Expense
    { wch: 20 }, // Expensed
    { wch: 20 }, // Invoice Billed
    { wch: 20 }, // Net Profit
    { wch: 10 }, // GPM (%)
    { wch: 12 }, // Status
    { wch: 10 }, // isLocked
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Project Report');

  XLSX.writeFile(wb, `ProjectReport_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
}
