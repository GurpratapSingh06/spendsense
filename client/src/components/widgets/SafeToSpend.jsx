import Card from '../ui/Card';
import AnimatedNumber from '../ui/AnimatedNumber';
import { calcSafeToSpend, getSpendStatus, calcRunOutDays, getFixedCostsData } from '../../utils/calcSafeToSpend';

export default function SafeToSpend({ budget, totalSpent, todaySpend, dailyAvg }) {
  const safe = calcSafeToSpend(budget, totalSpent, todaySpend);
  const status = getSpendStatus(safe, todaySpend);

  const totalAllowance = budget?.totalAllowance || 0;
  const { unpaidFixed } = getFixedCostsData(budget);
  
  // Math for the gauge
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  
  const spentRatio = totalAllowance > 0 ? (totalSpent + unpaidFixed) / totalAllowance : 0;
  const fillPercentage = Math.max(0, Math.min(1, spentRatio));
  const strokeDashoffset = Math.max(0, circumference - fillPercentage * circumference);

  const statusColors = {
    safe: '#22C55E', // success
    warning: '#F59E0B', // warning
    danger: '#EF4444', // danger
  };

  const ringColor = statusColors[status] || '#22C55E';
  
  const totalFixed = (budget?.fixedCosts ?? [])
    .reduce((sum, c) => sum + (c.amount ?? 0), 0)

  const remaining = (budget?.totalAllowance ?? 0)
    - totalFixed
    - (totalSpent ?? 0)

  const daysRemaining = budget ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate() + 1 : 1;
  const safeToSpendWidget = remaining / (daysRemaining ?? 1)

  return (
    <Card className="flex flex-col items-center justify-center text-center p-4 md:p-8">
      <div className="relative flex items-center justify-center w-[110px] h-[110px] md:w-48 md:h-48 mb-2 md:mb-4">
        {/* Background Track Circle */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle
            cx="50%" cy="50%" r="42%"
            stroke="#F3F4F6" strokeWidth="8" fill="none"
          />
          {/* Progress Arc */}
          <circle
            cx="50%" cy="50%" r="42%"
            stroke={ringColor} strokeWidth="8" fill="none"
            strokeLinecap="round"
            style={{
              strokeDasharray: '264%',
              strokeDashoffset: `${264 - (fillPercentage * 264)}%`,
              transition: 'stroke-dashoffset 1s ease-in-out'
            }}
          />
        </svg>
        {/* Inner Content */}
        <div className="flex flex-col items-center justify-center z-10 w-full h-full">
           <AnimatedNumber
            value={Math.max(0, safe)}
            className="text-[28px] md:text-[48px] font-num font-extrabold"
            style={{ color: ringColor }}
          />
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center gap-0.5 md:gap-1 mt-2 md:mt-0">
        <p className="text-[11px] md:text-[13px] uppercase text-[#6B7280] tracking-[0.06em]">Safe to spend today</p>
        <p className="text-[11px] text-[#9CA3AF]">
          ₹{Math.max(0, remaining).toLocaleString('en-IN')} left · {daysRemaining} days remaining
        </p>
      </div>
    </Card>
  );
}
