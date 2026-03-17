import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CATEGORY_MAP } from '../../constants/categories';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-surface border-l-4 border-accent shadow-md rounded-[12px] px-4 py-3 text-sm">
      <p className="text-secondary uppercase text-[11px] font-bold tracking-wider mb-1">{name}</p>
      <p className="text-primary font-bold font-num text-[16px]">₹{value.toLocaleString('en-IN')}</p>
    </div>
  );
};

export default function DoughnutChart({ data, height = 280 }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-500 text-sm" style={{ height }}>
        No spending data yet
      </div>
    );
  }

  const chartData = data.map(d => ({
    name: `${CATEGORY_MAP[d.category]?.emoji || ''} ${d.category}`,
    value: d.amount,
    color: CATEGORY_MAP[d.category]?.color || '#666',
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={75}
            outerRadius={95}
            paddingAngle={4}
            stroke="none"
            animationDuration={800}
            animationBegin={0}
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span className="text-secondary font-medium text-[12px]">{value}</span>}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center Total Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ marginTop: '-24px' }}>
        <span className="text-secondary text-[11px] font-bold uppercase tracking-wider">Total</span>
        <span className="text-primary font-num font-extrabold text-2xl">₹{total.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
}
