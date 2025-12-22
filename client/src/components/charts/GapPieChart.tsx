import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

type PieProps = {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
};

export function GapPieChart({ data }: PieProps) {
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
            innerRadius={73}
            outerRadius={110}
            minAngle={4}
            stroke="none">
            {data.map((item) => {
              return data.length === 1 ? (
                <Cell key={item.name} fill={item.color} />
              ) : (
                <Cell key={item.name} fill={item.color} stroke="#fff" strokeWidth={3} strokeLinecap="round" />
              );
            })}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
