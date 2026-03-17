import Card from '../ui/Card';
import { Flame } from 'lucide-react';

export default function StreakCounter({ currentStreak = 0, longestStreak = 0, thinkTwiceCount = 0 }) {
  const showFlame = currentStreak >= 3;

  return (
    <Card className="flex flex-col p-6">
      <p className="text-[12px] uppercase text-secondary font-bold tracking-wider mb-4">Streak Status</p>
      <div className="flex items-center gap-4 flex-1">
        <div className="text-5xl font-num font-extrabold text-accent">
          {currentStreak}
          {showFlame && <span className="ml-2 animate-pulse text-accent inline-block"><Flame size={24} strokeWidth={1.5} /></span>}
        </div>
        <div>
          <p className="text-[14px] text-primary font-bold">days in a row</p>
          <p className="text-[12px] text-secondary mt-0.5">Best record: {longestStreak} days</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-divider">
        <p className="text-[13px] text-secondary">
          Think Twice saves:{' '}
          <span className="text-primary font-bold">{thinkTwiceCount}</span>
        </p>
      </div>
    </Card>
  );
}
