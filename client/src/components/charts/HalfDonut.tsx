import { formatAmount } from '@/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

type HalfDonutProps = {
  value: number;
};

type HalfDonutTooltipProps = {
  active?: boolean;
  payload?: any[];
};

function HalfDonutTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const { name, netProfit } = payload[0].payload;
  if (name !== 'GPM') return null;

  return (
    <div className="z-90 rounded-md border bg-white/95 px-3 py-2 shadow-md">
      <div className="flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: '#6366F1' }} />
        <span className="text-sm font-medium text-gray-800">프로젝트 순이익</span>
      </div>
      <div className="text-right text-sm font-semibold text-gray-900">{formatAmount(netProfit)}원</div>
    </div>
  );
}

export function HalfDonut({ value, netProfit }: { value: number; netProfit: number }) {
  const isInvalid = value < 0;

  const safeValue = isInvalid ? 0 : Math.min(value, 100);
  const restValue = 100 - safeValue;

  const data = [
    {
      name: 'GPM',
      value: safeValue, // 퍼센트 비율
      netProfit, // Tooltip용 실제 값
      color: '#6366F1', // primary-blue
    },
    {
      name: 'rest',
      value: restValue,
      color: '#E5E7EB',
    },
  ];

  return (
    <div className="relative z-2 h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart responsive>
          <Pie
            data={data}
            dataKey="value"
            startAngle={450}
            endAngle={90}
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={0}
            stroke="none">
            <Cell className="fill-primary-blue-500" style={{ display: safeValue === 0 ? 'none' : 'block' }} />
            <Cell className="fill-gray-300" />
          </Pie>
          <Tooltip content={<HalfDonutTooltip />} cursor={false} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
