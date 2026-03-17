import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from '../components/ui/Card';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import { SkeletonCard } from '../components/ui/Skeleton';
import DoughnutChart from '../components/charts/DoughnutChart';
import SafeToSpend from '../components/widgets/SafeToSpend';
import VirtualPlant from '../components/widgets/VirtualPlant';
import StreakCounter from '../components/widgets/StreakCounter';
import AITip from '../components/widgets/AITip';
import { useStreak } from '../hooks/useStreak';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDateShort } from '../utils/dateHelpers';
import { CATEGORIES, CATEGORY_MAP } from '../constants/categories';
import api from '../utils/api';
import { useToast } from '../hooks/useToast';
import { getFixedCostsData } from '../utils/calcSafeToSpend';
import { Plus, AlertTriangle, AlertCircle, Info, Receipt, Trophy, CheckCircle, XCircle } from 'lucide-react';

export default function Dashboard() {
  const { budget, expenses, totalSpent, setShowAddExpense } = useOutletContext();
  const { streak } = useStreak();
  const { error: showError } = useToast();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fixedCostsPaid, setFixedCostsPaid] = useState([]);

  useEffect(() => {
    if (budget) {
      setFixedCostsPaid(budget.fixedCostsPaid || []);
    }
  }, [budget]);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const { data } = await api.get('/api/goals', { withCredentials: true });
        setGoals(data);
      } catch { /* silent */ }
      setLoading(false);
    };
    fetchGoals();
  }, []);

  const todaySpend = expenses
    .filter(e => new Date(e.date).toDateString() === new Date().toDateString())
    .reduce((s, e) => s + e.amount, 0);

  const todayDate = new Date().getDate();
  const dailyAvg = totalSpent / todayDate;

  const { unpaidFixed, totalFixed } = getFixedCostsData(budget);
  const remaining = budget ? budget.totalAllowance - unpaidFixed - totalSpent : 0;
  const usedPct = budget ? ((totalSpent + unpaidFixed) / budget.totalAllowance) * 100 : 0;

  const categoryData = CATEGORIES.map(cat => ({
    category: cat.key,
    amount: expenses.filter(e => e.category === cat.key).reduce((s, e) => s + e.amount, 0),
  })).filter(d => d.amount > 0);

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  if (loading && !budget) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const toggleFixedCostPaid = async (name, isPaid) => {
    try {
      if (isPaid) {
        // Unpay
        await api.put(`/api/budget/fixed-costs/${encodeURIComponent(name)}/unpay`, {}, { withCredentials: true });
        setFixedCostsPaid(prev => prev.filter(f => f.name !== name));
      } else {
        // Pay
        await api.put(`/api/budget/fixed-costs/${encodeURIComponent(name)}/pay`, {}, { withCredentials: true });
        setFixedCostsPaid(prev => [...prev, { name, paidAt: new Date() }]);
      }
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update payment status');
    }
  };

  const unpaidCosts = budget?.fixedCosts?.filter(c => !fixedCostsPaid.some(f => f.name === c.name)) || [];
  const urgentUnpaid = unpaidCosts[0]; // Take the first unpaid cost to show in banner

  return (
    <div className="space-y-3 md:space-y-6 animate-fade-in">
      {/* Page Actions */}
      <div className="flex justify-end items-center mb-2">
        <button
          onClick={() => setShowAddExpense(true)}
          className="bg-accent text-white w-9 h-9 p-0 md:w-auto md:h-auto md:px-4 md:py-2 rounded-full md:rounded-[10px] text-sm font-semibold hover:bg-[#EA6C0A] hover:shadow-card-hover transition-all flex items-center justify-center md:gap-2 active:scale-[0.97]"
        >
          <Plus size={16} strokeWidth={1.5} /> <span className="hidden md:inline">Add Expense</span>
        </button>
      </div>

      {/* Budget Alerts */}
      {urgentUnpaid && (
        <div className="bg-warning/10 border border-warning/30 px-3 md:px-4 py-2.5 md:py-3 text-[12px] md:text-sm rounded-[10px] md:rounded-xl mb-2 md:mb-0 leading-[1.4] text-warning font-medium">
          <AlertTriangle size={16} strokeWidth={1.5} className="inline mr-1" /> {urgentUnpaid.name} (₹{urgentUnpaid.amount.toLocaleString('en-IN')}) is unpaid — marking it paid will not affect your Safe to Spend as it is already accounted for.
        </div>
      )}
      {usedPct >= 100 && (
        <div className="bg-danger/10 border border-danger/30 px-3 md:px-4 py-2.5 md:py-3 text-[12px] md:text-sm rounded-[10px] md:rounded-xl mb-2 md:mb-0 leading-[1.4] text-danger font-medium">
          <AlertCircle size={16} strokeWidth={1.5} className="inline mr-1" /> You've exceeded your monthly budget! Review your spending.
        </div>
      )}
      {usedPct >= 85 && usedPct < 100 && (
        <div className="bg-warning/10 border border-warning/30 px-3 md:px-4 py-2.5 md:py-3 text-[12px] md:text-sm rounded-[10px] md:rounded-xl mb-2 md:mb-0 leading-[1.4] text-warning font-medium">
          <AlertTriangle size={16} strokeWidth={1.5} className="inline mr-1" /> You've used {Math.round(usedPct)}% of your budget. Spend carefully!
        </div>
      )}
      {usedPct >= 70 && usedPct < 85 && (
        <div className="bg-info/10 border border-info/30 px-3 md:px-4 py-2.5 md:py-3 text-[12px] md:text-sm rounded-[10px] md:rounded-xl mb-2 md:mb-0 leading-[1.4] text-info font-medium">
          <Info size={16} strokeWidth={1.5} className="inline mr-1" /> You've used {Math.round(usedPct)}% of your budget. Keep an eye on spending.
        </div>
      )}

      {/* Safe to Spend + Stat Cards — top row 4-col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-5">
        <SafeToSpend budget={budget} totalSpent={totalSpent} todaySpend={todaySpend} dailyAvg={dailyAvg} />
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {/* Card 1: SPENDABLE BUDGET */}
          <Card className="border-l-[4px] border-l-[#3B82F6] stagger-0 animate-slide-up !p-4 h-full flex flex-col justify-between">
            <div>
              <p className="text-[12px] uppercase text-secondary font-bold tracking-wider mb-1">Spendable Budget</p>
              <AnimatedNumber value={(budget?.totalAllowance || 0) - totalFixed} className="text-[28px] font-extrabold text-primary" />
            </div>
            <p className="text-[11px] text-secondary">₹{(budget?.totalAllowance || 0).toLocaleString('en-IN')} total − ₹{totalFixed.toLocaleString('en-IN')} fixed</p>
            <div>
              <span className="bg-[#F3F4F6] text-[#6B7280] text-[10px] px-2 py-1 rounded-full font-medium">After fixed costs</span>
            </div>
          </Card>

          {/* Card 2: TOTAL SPENT */}
          <Card className="border-l-[4px] border-l-[#F97316] stagger-1 animate-slide-up !p-4 h-full flex flex-col justify-between">
            <div>
              <p className="text-[12px] uppercase text-secondary font-bold tracking-wider mb-1">Total Spent</p>
              <AnimatedNumber value={totalSpent} className="text-[28px] font-extrabold text-primary" />
            </div>
            <p className="text-[11px] text-secondary">{expenses.length} expenses this month</p>
            <div className="text-[11px] font-medium text-[#6B7280]">
              First month tracking
            </div>
          </Card>

          {/* Card 3: DAYS LEFT */}
          <Card className="border-l-[4px] border-l-[#8B5CF6] stagger-2 animate-slide-up !p-4 h-full flex flex-col justify-between">
            <div>
              <p className="text-[12px] uppercase text-secondary font-bold tracking-wider mb-1 flex justify-between">
                <span>Days Left</span>
                <span className="text-[10px] font-normal normal-case">until month resets</span>
              </p>
              <AnimatedNumber value={
                new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()
              } className="text-[28px] font-extrabold text-primary" prefix="" />
            </div>
            <p className="text-[11px] text-secondary">
              Month resets {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleString('default', { month: 'long' })} 1
            </p>
            <div className="h-1 w-full bg-[#F3F4F6] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#8B5CF6] rounded-full" 
                style={{ width: `${(new Date().getDate() / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()) * 100}%` }}
              ></div>
            </div>
          </Card>

          {/* Card 4: DAILY AVG */}
          <Card className="border-l-[4px] border-l-[#F59E0B] stagger-3 animate-slide-up !p-4 h-full flex flex-col justify-between">
            <div>
              <p className="text-[12px] uppercase text-secondary font-bold tracking-wider mb-1">Daily Avg</p>
              <AnimatedNumber value={Math.round(dailyAvg)} className="text-[28px] font-extrabold text-primary" />
            </div>
            <p className="text-[11px] text-secondary">per day, averaged over month</p>
            <div className={`text-[11px] font-medium ${dailyAvg <= (budget ? ((budget.totalAllowance - totalFixed - totalSpent) / (new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate() + 1)) : 0) ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
              {dailyAvg <= (budget ? ((budget.totalAllowance - totalFixed - totalSpent) / (new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate() + 1)) : 0) ? <><CheckCircle size={12} strokeWidth={1.5} className="inline mr-0.5" /> Within safe limit</> : <><XCircle size={12} strokeWidth={1.5} className="inline mr-0.5" /> Above safe limit</>}
            </div>
          </Card>
        </div>
      </div>

      {/* Charts + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-5">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="section-header">Spending by Category</p>
            <span className="text-[11px] font-semibold text-secondary bg-[#F3F4F6] px-3 py-1 rounded-full">This month</span>
          </div>
          <DoughnutChart data={categoryData} />
        </Card>
        <Card>
          <p className="section-header mb-4">Recent Expenses</p>
          {recentExpenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="mb-2"><Receipt size={48} color="#D1D5DB" strokeWidth={1.5} /></p>
              <p className="text-secondary text-sm">No expenses yet</p>
              <p className="text-xs text-secondary mt-1">Press N to add your first expense →</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentExpenses.map((exp, i) => (
                <div key={exp._id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors animate-slide-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <span className="text-lg">{CATEGORY_MAP[exp.category]?.icon && (() => { const Icon = CATEGORY_MAP[exp.category].icon; return <Icon size={18} strokeWidth={1.5} style={{ color: CATEGORY_MAP[exp.category].color }} />; })()}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-primary truncate">{exp.description}</p>
                    <p className="text-xs text-secondary">{formatDateShort(exp.date)}</p>
                  </div>
                  <span className="font-mono-amounts text-sm text-accent font-medium">-₹{exp.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Category Progress + Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-5">
        <Card>
          <p className="section-header mb-4">Category Budgets</p>
          {budget?.categoryLimits ? (
            <div className="space-y-3">
              {CATEGORIES.map(cat => {
                const limit = budget.categoryLimits[cat.key] || 0;
                const spent = expenses.filter(e => e.category === cat.key).reduce((s, e) => s + e.amount, 0);
                if (limit === 0 && spent === 0) return null;
                return (
                  <div key={cat.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-primary flex items-center gap-1">
                        {(() => { const Icon = cat.icon; return <Icon size={14} strokeWidth={1.5} />; })()} {cat.key}
                      </span>
                      <span className="font-mono-amounts text-xs text-secondary">
                        ₹{spent.toLocaleString('en-IN')} / ₹{limit.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <ProgressBar value={spent} max={limit} color={cat.color} />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-secondary text-center py-4">Set up your budget to see progress</p>
          )}
        </Card>
        <Card>
          <p className="section-header mb-4">Savings Goals</p>
          {goals.length === 0 ? (
            <div className="text-center py-8">
              <p className="mb-2"><Trophy size={48} color="#D1D5DB" strokeWidth={1.5} /></p>
              <p className="text-secondary text-sm">No goals yet</p>
              <p className="text-xs text-secondary mt-1">Create a savings goal to start tracking</p>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.slice(0, 3).map(goal => (
                <div key={goal._id} className="bg-[#F9FAFB] rounded-xl p-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-primary font-medium">{goal.name}</span>
                    <span className="font-num text-xs text-secondary">
                      {Math.round((goal.savedAmount / goal.targetAmount) * 100)}%
                    </span>
                  </div>
                  <ProgressBar value={goal.savedAmount} max={goal.targetAmount} color="#3B82F6" />
                  <p className="font-mono-amounts text-xs text-secondary mt-1">
                    ₹{goal.savedAmount.toLocaleString('en-IN')} of ₹{goal.targetAmount.toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Fixed Costs Row */}
      {budget?.fixedCosts?.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:gap-5">
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <p className="section-header">Fixed Monthly Costs</p>
              <p className="text-[13px] text-secondary font-medium bg-[#F9FAFB] px-3 py-1 rounded-full border border-divider">
                {fixedCostsPaid.length} of {budget.fixedCosts.length} fixed costs paid this month
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {budget.fixedCosts.map((cost, i) => {
                const isPaid = fixedCostsPaid.some(f => f.name === cost.name);
                return (
                  <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors border ${isPaid ? 'bg-[#F0FDF4] border-[#86EFAC]/50' : 'bg-white border-divider'}`}>
                    <input
                      type="checkbox"
                      checked={isPaid}
                      onChange={() => toggleFixedCostPaid(cost.name, isPaid)}
                      className="accent-accent w-5 h-5 cursor-pointer flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isPaid ? 'line-through text-[#6B7280]' : 'text-primary'}`}>{cost.name}</p>
                      <p className={`font-mono-amounts text-sm ${isPaid ? 'text-[#22C55E]' : 'text-secondary'}`}>
                        ₹{cost.amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                    {isPaid ? (
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-[#DCFCE7] text-[#166534] px-2 py-1 rounded-md flex-shrink-0 flex items-center gap-0.5"><CheckCircle size={10} strokeWidth={1.5} /> Paid</span>
                    ) : (
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-[#FEF3C7] text-[#92400E] px-2 py-1 rounded-md flex-shrink-0">Due</span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Widgets Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
        <AITip />
        <StreakCounter
          currentStreak={streak?.currentStreak || 0}
          longestStreak={streak?.longestStreak || 0}
          thinkTwiceCount={streak?.thinkTwiceCount || 0}
        />
        <VirtualPlant
          plantStage={streak?.plantStage || 1}
          streak={streak?.currentStreak || 0}
        />
      </div>
    </div>
  );
}
