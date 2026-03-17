import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { CATEGORIES, DEFAULT_BUDGET_PERCENTAGES } from '../../constants/categories';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Rocket } from 'lucide-react';

const STEPS = ['Monthly Allowance', 'Category Limits', 'First Goal'];

export default function OnboardingModal({ isOpen, onComplete }) {
  const [step, setStep] = useState(0);
  const { completeOnboarding } = useAuth();
  const [allowance, setAllowance] = useState('12000');
  const [limits, setLimits] = useState(() => {
    const l = {};
    CATEGORIES.forEach(c => {
      l[c.key] = Math.round(12000 * (DEFAULT_BUDGET_PERCENTAGES[c.key] || 5) / 100);
    });
    return l;
  });
  const [goal, setGoal] = useState({ name: '', target: '' });

  const updateLimitsFromAllowance = (val) => {
    const a = parseFloat(val) || 0;
    const l = {};
    CATEGORIES.forEach(c => {
      l[c.key] = Math.round(a * (DEFAULT_BUDGET_PERCENTAGES[c.key] || 5) / 100);
    });
    setLimits(l);
  };

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
    else handleFinish();
  };

  const handleFinish = async () => {
    await completeOnboarding();
    onComplete({
      allowance: parseFloat(allowance) || 12000,
      limits,
      goal: goal.name ? goal : null,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="" size="md">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-display font-bold text-primary mb-1 flex items-center justify-center gap-2">
          Welcome to SpendSense <Sparkles size={24} className="text-accent" strokeWidth={1.5} />
        </h1>
        <p className="text-secondary text-sm">Let's set things up in 3 quick steps</p>
        <div className="flex justify-center gap-2 mt-4">
          {STEPS.map((s, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i === step ? 'bg-accent scale-125' : i < step ? 'bg-accent/50' : 'bg-divider'}`} />
          ))}
        </div>
      </div>

      <div className="min-h-[200px] animate-fade-in" key={step}>
        {step === 0 && (
          <div className="text-center space-y-4">
            <p className="text-secondary text-sm">What's your monthly allowance?</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl text-secondary">₹</span>
              <input
                type="number"
                value={allowance}
                onChange={e => { setAllowance(e.target.value); updateLimitsFromAllowance(e.target.value); }}
                className="!rounded-xl !px-4 !py-3 text-3xl font-num text-center w-48"
                placeholder="12000"
              />
            </div>
            <p className="text-xs text-secondary">You can always change this later</p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-center text-secondary text-sm mb-4">We've pre-filled smart defaults based on student averages</p>
            {CATEGORIES.map(cat => (
              <div key={cat.key} className="flex items-center gap-3">
                <span className="w-6 flex justify-center">{(() => { const Icon = cat.icon; return <Icon size={16} strokeWidth={1.5} />; })()}</span>
                <span className="text-sm text-primary w-28">{cat.key}</span>
                <input
                  type="number"
                  value={limits[cat.key]}
                  onChange={e => setLimits(p => ({ ...p, [cat.key]: parseInt(e.target.value) || 0 }))}
                  className="flex-1 text-sm font-num"
                />
                <span className="text-xs text-secondary font-num w-10">
                  {Math.round(((limits[cat.key] || 0) / (parseFloat(allowance) || 1)) * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="text-center space-y-4">
            <p className="text-secondary text-sm">Set your first savings goal</p>
            <input
              type="text"
              value={goal.name}
              onChange={e => setGoal(p => ({ ...p, name: e.target.value }))}
              className="w-full text-sm"
              placeholder="e.g. New laptop, Trip to Goa..."
            />
            <div className="flex items-center gap-2">
              <span className="text-secondary">₹</span>
              <input
                type="number"
                value={goal.target}
                onChange={e => setGoal(p => ({ ...p, target: e.target.value }))}
                className="flex-1 text-sm font-num"
                placeholder="Target amount"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-6">
        <button
          onClick={handleFinish}
          className="text-sm text-secondary hover:text-primary transition-colors"
        >
          Skip setup →
        </button>
        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>
          )}
          <Button onClick={handleNext}>
            {step === 2 ? <span className="flex items-center gap-2">Start Tracking <Rocket size={16} strokeWidth={1.5} /></span> : 'Next'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
