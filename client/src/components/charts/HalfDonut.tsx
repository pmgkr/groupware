import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

type HalfDonutProps = {
  value: number; // 0 ~ 100
};

export function HalfDonut({ value }: HalfDonutProps) {
  const data = [
    { name: 'value', value },
    { name: 'rest', value: 100 - value },
  ];

  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart responsive>
          <Pie data={data} dataKey="value" startAngle={450} endAngle={90} innerRadius={70} outerRadius={100} paddingAngle={0} stroke="none">
            <Cell className="fill-primary-blue-500" />
            <Cell className="fill-gray-300" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
