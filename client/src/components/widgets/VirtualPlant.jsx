import Card from '../ui/Card';
import { Sprout } from 'lucide-react';

const STAGES = [
  { name: 'Seed', scale: 0.5, desc: '0-2 days' },
  { name: 'Sprout', scale: 0.7, desc: '3-5 days' },
  { name: 'Sapling', scale: 0.9, desc: '6-8 days' },
  { name: 'Plant', scale: 1.1, desc: '9-11 days' },
  { name: 'Tree', scale: 1.3, desc: '12+ days' },
];

export default function VirtualPlant({ plantStage = 1, streak = 0 }) {
  const stage = STAGES[Math.min(plantStage, 5) - 1] || STAGES[0];

  return (
    <Card className="flex flex-col items-center text-center p-6 relative overflow-hidden">
      <div className="absolute top-4 right-4 bg-accent/10 text-accent text-[11px] font-bold px-2.5 py-1 rounded-full">
        {streak} Day Streak
      </div>
      
      <p className="text-[12px] uppercase text-secondary font-bold tracking-wider mb-6 self-start">Your Plant</p>
      
      <div className="w-32 h-32 rounded-full bg-[#F0FDF4] flex items-center justify-center relative mb-4">
        <div className="transition-all duration-500 text-success" style={{ transform: `scale(${stage.scale})` }} key={plantStage}>
          <Sprout size={48} strokeWidth={1.5} />
        </div>
      </div>

      <p className="text-[16px] font-bold text-primary">{stage.name}</p>
      <p className="text-[12px] text-secondary mt-1">{stage.desc}</p>
      
      <div className="mt-4 flex justify-center gap-1.5 border-t border-divider pt-4 w-full">
        {STAGES.map((s, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i < plantStage ? 'bg-success' : 'bg-surface-2 border border-divider'
            }`}
          />
        ))}
      </div>
    </Card>
  );
}
