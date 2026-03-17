import { useState, useEffect, useRef, useCallback } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import BarChart from '../components/charts/BarChart';
import { useToast } from '../hooks/useToast';
import { useBudget } from '../hooks/useBudget';
import { useExpenses } from '../hooks/useExpenses';
import { CATEGORIES } from '../constants/categories';
import { formatCurrency } from '../utils/formatCurrency';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function BudgetPage() {
  const { budget, saveBudget } = useBudget();
  const { expenses, categoryTotals } = useExpenses();
  const { success, error: showError, warning } = useToast();

  const [form, setForm] = useState({
    totalAllowance: '',
    startingBalance: '',
    fixedCosts: [],
    categoryLimits: {},
  });
  const [saved, setSaved] = useState(false);
  const [newFixedName, setNewFixedName] = useState('');
  const [newFixedAmount, setNewFixedAmount] = useState('');
  const [fixedCostsPaid, setFixedCostsPaid] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (budget) {
      setForm({
        totalAllowance: budget.totalAllowance || '',
        startingBalance: budget.startingBalance || '',
        fixedCosts: budget.fixedCosts || [],
        categoryLimits: budget.categoryLimits || {},
      });
      setFixedCostsPaid(budget.fixedCostsPaid || []);
    }
  }, [budget]);

  const autoSave = useCallback((formData) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await saveBudget(formData);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch { /* silent */ }
    }, 800);
  }, [saveBudget]);

  const updateForm = (key, value) => {
    const updated = { ...form, [key]: value };
    setForm(updated);
    autoSave(updated);
  };

  const updateLimit = (cat, value) => {
    const updated = { ...form, categoryLimits: { ...form.categoryLimits, [cat]: parseInt(value) || 0 } };
    setForm(updated);
    autoSave(updated);
  };

  const addFixedCost = () => {
    if (!newFixedName || !newFixedAmount) return;
    const updated = {
      ...form,
      fixedCosts: [...form.fixedCosts, { name: newFixedName, amount: parseFloat(newFixedAmount) }],
    };
    setForm(updated);
    setNewFixedName('');
    setNewFixedAmount('');
    autoSave(updated);
  };

  const removeFixedCost = (index) => {
    const updated = { ...form, fixedCosts: form.fixedCosts.filter((_, i) => i !== index) };
    setForm(updated);
    autoSave(updated);
  };

  const toggleFixedCostPaid = async (name, isPaid) => {
    try {
      if (isPaid) {
        // Unpay
        await axios.put(`/api/budget/fixed-costs/${encodeURIComponent(name)}/unpay`, {}, { withCredentials: true });
        setFixedCostsPaid(prev => prev.filter(f => f.name !== name));
      } else {
        // Pay
        await axios.put(`/api/budget/fixed-costs/${encodeURIComponent(name)}/pay`, {}, { withCredentials: true });
        setFixedCostsPaid(prev => [...prev, { name, paidAt: new Date() }]);
      }
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update payment status');
    }
  };

  const totalLimits = Object.values(form.categoryLimits).reduce((s, v) => s + (v || 0), 0);
  const limitsExceed = totalLimits > (parseFloat(form.totalAllowance) || 0);
  const totalFixed = form.fixedCosts.reduce((s, c) => s + c.amount, 0);

  const chartData = CATEGORIES.map(cat => ({
    category: cat.key,
    budget: form.categoryLimits[cat.key] || 0,
    spent: categoryTotals[cat.key] || 0,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">Budget</h1>
          <p className="text-secondary text-sm mt-1">Plan your monthly spending</p>
        </div>
        {saved && (
          <span className="text-accent text-sm font-semibold animate-fade-in flex items-center gap-1"><CheckCircle size={14} strokeWidth={1.5} /> Saved</span>
        )}
      </div>

      {limitsExceed && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl px-4 py-3 text-sm text-warning font-medium">
          <AlertTriangle size={16} strokeWidth={1.5} className="inline mr-1" /> Category limits (₹{totalLimits.toLocaleString('en-IN')}) exceed total budget (₹{(parseFloat(form.totalAllowance) || 0).toLocaleString('en-IN')})
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Budget Settings */}
        <div className="space-y-5">
          <Card>
            <p className="section-header mb-3">Monthly Income / Allowance</p>
            <div className="flex items-center gap-2">
              <span className="text-secondary text-lg">₹</span>
              <input
                type="number"
                value={form.totalAllowance}
                onChange={e => updateForm('totalAllowance', parseFloat(e.target.value) || 0)}
                className="flex-1 text-lg font-num"
                placeholder="12000"
              />
            </div>
          </Card>

          <Card>
            <div className="flex flex-col mb-3">
              <p className="section-header">Fixed Monthly Costs</p>
              <p className="text-[12px] text-[#9CA3AF] italic mt-0.5">Mark costs as paid when you've made the payment</p>
            </div>
            <div className="space-y-2 mb-2">
            {form.fixedCosts.map((cost, i) => {
              const isPaid = fixedCostsPaid.some(f => f.name === cost.name);
              return (
              <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${isPaid ? 'bg-[#F0FDF4]' : 'bg-white'}`}>
                <input
                  type="checkbox"
                  checked={isPaid}
                  onChange={() => toggleFixedCostPaid(cost.name, isPaid)}
                  className="accent-accent w-4 h-4 cursor-pointer"
                />
                <span className={`text-sm flex-1 ${isPaid ? 'line-through text-[#6B7280]' : 'text-primary'}`}>{cost.name}</span>
                <span className={`font-mono-amounts text-sm ${isPaid ? 'text-[#22C55E]' : 'text-secondary'}`}>₹{cost.amount.toLocaleString('en-IN')}</span>
                <button onClick={() => removeFixedCost(i)} className="text-secondary hover:text-danger text-sm transition-colors ml-2">×</button>
              </div>
            )})}
            </div>
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={newFixedName}
                onChange={e => setNewFixedName(e.target.value)}
                className="flex-1 text-sm"
                placeholder="e.g. Hostel Rent"
              />
              <input
                type="number"
                value={newFixedAmount}
                onChange={e => setNewFixedAmount(e.target.value)}
                className="w-24 text-sm font-num"
                placeholder="₹"
              />
              <Button size="sm" onClick={addFixedCost}>Add</Button>
            </div>
            {form.fixedCosts.length > 0 && (
              <p className="text-xs text-secondary font-num mt-2">
                Total fixed: ₹{totalFixed.toLocaleString('en-IN')}
              </p>
            )}
          </Card>

          <Card>
            <p className="section-header mb-3">Category Limits</p>
            <div className="space-y-3">
              {CATEGORIES.map(cat => {
                const limit = form.categoryLimits[cat.key] || 0;
                const spent = categoryTotals[cat.key] || 0;
                return (
                  <div key={cat.key}>
                    <div className="flex items-center gap-3 mb-1">
                      {(() => { const Icon = cat.icon; return <Icon size={14} strokeWidth={1.5} />; })()}
                      <span className="text-sm text-primary flex-1">{cat.key}</span>
                      <span className="text-xs font-mono-amounts text-secondary">
                        Spent: ₹{spent.toLocaleString('en-IN')}
                      </span>
                      <input
                        type="number"
                        value={limit || ''}
                        onChange={e => updateLimit(cat.key, e.target.value)}
                        className="w-24 text-sm font-num text-right"
                        placeholder="0"
                      />
                    </div>
                    <ProgressBar value={spent} max={limit || 1} color={cat.color} height={4} />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Budget Chart */}
        <div>
          <Card>
            <p className="section-header mb-4">Budget vs Actual</p>
            <BarChart data={chartData} xKey="category" />
          </Card>
        </div>
      </div>
    </div>
  );
}
