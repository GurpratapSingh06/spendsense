import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border-l-4 border-accent shadow-md rounded-[12px] px-4 py-3 text-sm">
      <p className="text-secondary uppercase text-[11px] font-bold tracking-wider mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-num font-bold text-sm" style={{ color: p.color }}>
          {p.name}: ₹{p.value?.toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  );
};

export default function BarChart({ data, height = 300, budgetKey = 'budget', spentKey = 'spent', xKey = 'category' }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-500 text-sm" style={{ height }}>
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
        <Legend
          formatter={(value) => <span className="text-secondary font-medium text-[12px]">{value}</span>}
          iconType="circle"
          iconSize={8}
        />
        <Bar dataKey={budgetKey} fill="#E5E7EB" name="Budget" radius={[6, 6, 0, 0]} animationDuration={800} />
        <Bar dataKey={spentKey} fill="#F97316" name="Spent" radius={[6, 6, 0, 0]} animationDuration={800} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
