import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border-l-4 border-accent shadow-md rounded-[12px] px-4 py-3 text-sm">
      <p className="text-secondary uppercase text-[11px] font-bold tracking-wider mb-1">{label}</p>
      <p className="text-primary font-num font-extrabold text-[16px]">₹{payload[0].value?.toLocaleString('en-IN')}</p>
    </div>
  );
};

export default function LineChart({ data, height = 300, dataKey = 'amount', xKey = 'date' }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-500 text-sm" style={{ height }}>
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke="#F97316"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 6, fill: '#F97316', stroke: '#fff', strokeWidth: 2 }}
          animationDuration={800}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
