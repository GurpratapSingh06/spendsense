import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from '../components/ui/Card';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';
import DoughnutChart from '../components/charts/DoughnutChart';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import { CATEGORIES, CATEGORY_MAP } from '../constants/categories';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDateShort } from '../utils/dateHelpers';
import { FileText } from 'lucide-react';

export default function Analytics() {
  const { budget, expenses, totalSpent } = useOutletContext();

  const dailyData = useMemo(() => {
    const byDay = {};
    expenses.forEach(e => {
      const key = formatDateShort(e.date);
      byDay[key] = (byDay[key] || 0) + e.amount;
    });
    return Object.entries(byDay)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => {
        const dA = new Date(a.date + ' 2026');
        const dB = new Date(b.date + ' 2026');
        return dA - dB;
      });
  }, [expenses]);

  const categoryData = useMemo(() => {
    return CATEGORIES.map(cat => ({
      category: cat.key,
      amount: expenses.filter(e => e.category === cat.key).reduce((s, e) => s + e.amount, 0),
    })).filter(d => d.amount > 0);
  }, [expenses]);

  const categoryBarData = useMemo(() => {
    return CATEGORIES.map(cat => ({
      category: cat.key,
      budget: budget?.categoryLimits?.[cat.key] || 0,
      spent: expenses.filter(e => e.category === cat.key).reduce((s, e) => s + e.amount, 0),
    }));
  }, [expenses, budget]);

  const stats = useMemo(() => {
    if (expenses.length === 0) return null;
    const biggest = expenses.reduce((max, e) => e.amount > max.amount ? e : max, expenses[0]);
    const topCat = categoryData.length > 0 ? categoryData.reduce((max, c) => c.amount > max.amount ? c : max) : null;
    const avgPerTx = Math.round(totalSpent / expenses.length);

    const dayTotals = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    expenses.forEach(e => {
      const day = new Date(e.date).getDay();
      dayTotals[day] = (dayTotals[day] || 0) + e.amount;
    });
    const bestDay = Object.entries(dayTotals).sort(([,a],[,b]) => a - b)[0];

    const uniqueDays = new Set(expenses.map(e => new Date(e.date).toDateString())).size;
    const daysUnder = (() => {
      if (!budget) return 0;
      const safeDaily = budget.totalAllowance / 30;
      const dayMap = {};
      expenses.forEach(e => {
        const key = new Date(e.date).toDateString();
        dayMap[key] = (dayMap[key] || 0) + e.amount;
      });
      return Object.values(dayMap).filter(v => v <= safeDaily).length;
    })();

    return { biggest, topCat, avgPerTx, bestDay: bestDay ? dayNames[bestDay[0]] : 'N/A', uniqueDays, daysUnder };
  }, [expenses, categoryData, totalSpent, budget]);

  const summary = useMemo(() => {
    if (!stats || !stats.topCat) return '';
    const topPct = Math.round((stats.topCat.amount / totalSpent) * 100);
    return `This month you spent the most on ${stats.topCat.category} (₹${stats.topCat.amount.toLocaleString('en-IN')} — ${topPct}% of total). ${
      stats.bestDay ? `Your safest day was ${stats.bestDay}.` : ''
    } You've stayed under budget for ${stats.daysUnder} of ${stats.uniqueDays} days.`;
  }, [stats, totalSpent]);

  const handleExportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const el = document.getElementById('analytics-content');
      if (!el) return;

      const canvas = await html2canvas(el, { backgroundColor: '#F0F2F5', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('SpendSense-Report.pdf');
    } catch {
      alert('PDF export failed. Please try again.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">Analytics</h1>
          <p className="text-secondary text-sm mt-1">Deep dive into your spending patterns</p>
        </div>
        <Button variant="ghost" onClick={handleExportPDF}><FileText size={14} strokeWidth={1.5} className="inline mr-1" /> Export PDF</Button>
      </div>

      <div id="analytics-content" className="space-y-6">
        {/* Key Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Card>
              <p className="section-header mb-1">Biggest Expense</p>
              <p className="text-sm text-primary truncate">{stats.biggest.description}</p>
              <p className="font-num text-lg font-bold text-accent">₹{stats.biggest.amount.toLocaleString('en-IN')}</p>
            </Card>
            <Card>
              <p className="section-header mb-1">Top Category</p>
              {stats.topCat && <Badge category={stats.topCat.category} />}
              <p className="font-num text-lg font-bold text-info mt-1">₹{stats.topCat?.amount.toLocaleString('en-IN')}</p>
            </Card>
            <Card>
              <p className="section-header mb-1">Avg Per Transaction</p>
              <AnimatedNumber value={stats.avgPerTx} className="text-lg font-bold text-primary" />
            </Card>
            <Card>
              <p className="section-header mb-1">Safest Day</p>
              <p className="text-lg font-bold text-accent">{stats.bestDay}</p>
            </Card>
          </div>
        )}

        {/* Daily Spending Line Chart */}
        <Card>
          <p className="section-header mb-4">Daily Spending Trend</p>
          <LineChart data={dailyData} />
        </Card>

        {/* Category Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <p className="section-header mb-4">Category Breakdown</p>
            <DoughnutChart data={categoryData} />
          </Card>
          <Card>
            <p className="section-header mb-4">Budget vs Actual</p>
            <BarChart data={categoryBarData} xKey="category" />
          </Card>
        </div>

        {/* Category Percentage List */}
        {categoryData.length > 0 && (
          <Card>
            <p className="section-header mb-4">Category Percentages</p>
            <div className="space-y-2">
              {categoryData
                .sort((a, b) => b.amount - a.amount)
                .map(cat => {
                  const pct = totalSpent > 0 ? Math.round((cat.amount / totalSpent) * 100) : 0;
                  return (
                    <div key={cat.category} className="flex items-center gap-3">
                      {(() => { const Icon = CATEGORY_MAP[cat.category]?.icon; return Icon ? <Icon size={16} strokeWidth={1.5} /> : null; })()}
                      <span className="text-sm text-primary w-28">{cat.category}</span>
                      <div className="flex-1 h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-600"
                          style={{ width: `${pct}%`, backgroundColor: CATEGORY_MAP[cat.category]?.color }}
                        />
                      </div>
                      <span className="font-num text-xs text-secondary w-16 text-right">{pct}%</span>
                      <span className="font-mono-amounts text-xs text-primary w-20 text-right">₹{cat.amount.toLocaleString('en-IN')}</span>
                    </div>
                  );
                })}
            </div>
          </Card>
        )}

        {/* Auto Summary */}
        {summary && (
          <Card className="border-l-4 border-l-info">
            <p className="section-header mb-2"><FileText size={16} strokeWidth={1.5} className="inline mr-1" /> Auto-Generated Summary</p>
            <p className="text-sm text-secondary leading-relaxed">{summary}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
