// components/features/Project/utils/chartMap.ts
import { getProjectExpenseType } from '@/api';
import type { InvoiceListItem } from '@/api'; // 인보이스용
import { PIE_COLORS } from '@components/charts/colors';

type ExpenseTypeDTO = {
  code: string;
  name?: string;
};

export async function buildExpenseColorMap() {
  const [type1, type2] = await Promise.all([getProjectExpenseType('exp_type1'), getProjectExpenseType('exp_type2')]);
  const uniqueCodes = Array.from(new Set([...type1, ...type2].map((t: ExpenseTypeDTO) => t.code)));

  const colorMap: Record<string, string> = {};

  let colorIndex = 0;

  uniqueCodes.forEach((code) => {
    if (colorMap[code]) return;

    colorMap[code] = PIE_COLORS[colorIndex % PIE_COLORS.length];
    colorIndex += 1;
  });

  return colorMap;
}

export const MIN_PERCENT = 0.5; // 최소 2%

export type PieItem = {
  name: string;
  value: number; // 실제 값
  color: string;
};

export type PieChartItem = {
  name: string;
  value: number; // 차트용 값
  realValue: number; // 실제 값 (표시용)
  color: string;
  count?: number;
};

export function buildPieChartData(data: PieItem[]): PieChartItem[] {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return [];

  // 실제 퍼센트 계산
  const withPercent = data.map((d) => ({
    ...d,
    percent: (d.value / total) * 100,
  }));

  let adjustedTotal = 0;

  const adjusted = withPercent.map((d) => {
    const adjustedValue = d.percent < MIN_PERCENT ? (MIN_PERCENT / 100) * total : d.value;

    adjustedTotal += adjustedValue;

    return {
      name: d.name,
      value: adjustedValue,
      realValue: d.value,
      color: d.color,
    };
  });

  // 전체 합 보정 (가장 큰 항목에 차이 반영)
  const diff = total - adjustedTotal;

  if (Math.abs(diff) > 0.01) {
    const maxItem = adjusted.reduce((a, b) => (a.realValue > b.realValue ? a : b));
    maxItem.value += diff;
  }

  return adjusted;
}

// 상위 6개의 리스트만 우선으로 보이고, 6개 초과되는 리스트는 '그 외'로 묶어서 보이기
export function groupExpenseForChart(data: PieChartItem[], maxItems = 6): PieChartItem[] {
  if (data.length <= maxItems) return data;

  // realValue 기준 내림차순
  const sorted = [...data].sort((a, b) => b.realValue - a.realValue);

  const visible = sorted.slice(0, maxItems);
  const rest = sorted.slice(maxItems);

  const restTotal = rest.reduce((sum, item) => sum + item.realValue, 0);

  return [
    ...visible,
    {
      name: `그 외 ${rest.length}개 항목`,
      value: restTotal,
      realValue: restTotal,
      color: '#aaa', // gray-400 정도 권장
      count: rest.length,
    },
  ];
}

// 인보이스용 파이차트 데이터 정제
export function buildInvoicePieChartData(invoices: InvoiceListItem[]): PieChartItem[] {
  if (!invoices.length) return [];

  // client_nm 기준 합산
  const map = invoices.reduce<Record<string, number>>((acc, cur) => {
    const key = cur.client_nm || '기타';
    acc[key] = (acc[key] || 0) + Number(cur.invoice_amount || 0);
    return acc;
  }, {});

  // 2. 금액 기준 내림차순 정렬 (색 배치 안정화)
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);

  // 3. PIE_COLORS를 순서대로 할당
  return entries.map(([name, total], idx) => ({
    name,
    value: total,
    realValue: total,
    color: PIE_COLORS[idx % PIE_COLORS.length],
  }));
}
