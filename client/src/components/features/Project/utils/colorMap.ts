// components/features/Project/utils/colorMap.ts
import { getProjectExpenseType } from '@/api';
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
