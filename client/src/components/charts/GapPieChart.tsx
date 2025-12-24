import { formatAmount } from '@/utils';
import type { PieChartItem } from '@/components/features/Project/utils/chartMap';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, type PieLabelRenderProps } from 'recharts';

type PieMode = 'pie' | 'donut';

type PieModeConfig = {
  innerRadius: number;
  outerRadius: number;
  minAngle: number;
  hasGap: boolean;
  strokeWidth: number;
};

export const PIE_MODE_CONFIG: Record<PieMode, PieModeConfig> = {
  pie: {
    innerRadius: 0,
    outerRadius: 110,
    minAngle: 4,
    hasGap: false,
    strokeWidth: 0,
  },
  donut: {
    innerRadius: 73,
    outerRadius: 110,
    minAngle: 4,
    hasGap: true,
    strokeWidth: 3,
  },
};

const RADIAN = Math.PI / 180;

const createPieLabelRenderer =
  (totalRealValue: number) =>
  ({ cx, cy, midAngle, innerRadius, outerRadius, payload }: PieLabelRenderProps) => {
    if (!payload || totalRealValue === 0) return null;

    const realValue = payload.realValue ?? payload.value;
    if (!realValue) return null;

    const percent = (realValue / totalRealValue) * 100;

    // ✅ 1% 미만은 아예 표시하지 않음 (강력 추천)
    if (percent < 1) return null;

    const displayPercent = Math.floor(percent); // 🔑 핵심

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = Number(cx) + radius * Math.cos(-(midAngle ?? 0) * RADIAN);
    const y = Number(cy) + radius * Math.sin(-(midAngle ?? 0) * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        fontSize={11}
        fontWeight={600}
        textAnchor={x > Number(cx) ? 'start' : 'end'}
        dominantBaseline="central">
        {displayPercent}%
      </text>
    );
  };

type PieProps = {
  data: PieChartItem[];
  mode?: PieMode;
};

type Props = {
  active?: boolean;
  payload?: any[];
};

export function GapPieTooltip({ active, payload }: Props) {
  if (!active || !payload || payload.length === 0) return null;

  const { name, value, color, realValue } = payload[0].payload;

  return (
    <div className="rounded-md border bg-white/95 p-2.5 shadow-md">
      <div className="flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
        <span className="text-sm font-medium text-gray-800">{name}</span>
      </div>
      {realValue !== 0 && <div className="text-right text-sm font-semibold text-gray-900">{formatAmount(realValue)}원</div>}
    </div>
  );
}

export function GapPieChart({ data, mode = 'donut' }: PieProps) {
  const config = PIE_MODE_CONFIG[mode];
  const totalRealValue = data.reduce((sum, item) => sum + (item.realValue ?? item.value), 0);

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            startAngle={450}
            endAngle={90}
            innerRadius={config.innerRadius}
            outerRadius={config.outerRadius}
            minAngle={config.minAngle}
            label={mode === 'pie' ? createPieLabelRenderer(totalRealValue) : false}
            labelLine={false}
            stroke="none">
            {data.map((item) => {
              return data.length === 1 ? (
                <Cell key={item.name} fill={item.color} />
              ) : (
                <Cell key={item.name} fill={item.color} stroke="#fff" strokeWidth={config.strokeWidth} strokeLinecap="round" />
              );
            })}
          </Pie>
          <Tooltip content={<GapPieTooltip />} cursor={false} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
