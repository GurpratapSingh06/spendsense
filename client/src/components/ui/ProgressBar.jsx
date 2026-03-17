import { useEffect, useState } from 'react';

export default function ProgressBar({ value = 0, max = 100, color = '#22C55E', height = 8, showLabel = false, animated = true }) {
  const [width, setWidth] = useState(0);
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setWidth(pct), 50);
      return () => clearTimeout(timer);
    } else {
      setWidth(pct);
    }
  }, [pct, animated]);

  // Gradient fills per spec
  const getGradient = () => {
    if (pct >= 100) return 'linear-gradient(90deg, #FCA5A5, #EF4444)'; // Over
    if (pct >= 85) return 'linear-gradient(90deg, #FCD34D, #F59E0B)'; // Warning
    return `linear-gradient(90deg, #86EFAC, #22C55E)`; // On track
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-end mb-1">
          <span className="font-num text-xs text-secondary">{Math.round(pct)}%</span>
        </div>
      )}
      <div className="w-full rounded-full overflow-hidden" style={{ height, backgroundColor: '#F3F4F6' }}>
        <div
          className="rounded-full"
          style={{
            width: `${width}%`,
            height: '100%',
            background: getGradient(),
            transition: animated ? 'width 0.6s ease-out' : 'none',
          }}
        />
      </div>
    </div>
  );
}
