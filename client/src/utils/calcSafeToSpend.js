export function getFixedCostsData(budget) {
  if (!budget) return { totalFixed: 0, paidNames: [], unpaidFixed: 0 };

  // Step 1: get total of ALL fixed costs
  const totalFixed = (budget.fixedCosts || []).reduce((sum, c) => sum + c.amount, 0);

  // Step 2: get names of costs paid THIS calendar month only
  const now = new Date();
  const paidNames = (budget.fixedCostsPaid || [])
    .filter(p => {
      const d = new Date(p.paidAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .map(p => p.name);

  // Step 3: sum only the UNPAID ones
  const unpaidFixed = (budget.fixedCosts || [])
    .filter(c => !paidNames.includes(c.name))
    .reduce((sum, c) => sum + c.amount, 0);

  return { totalFixed, paidNames, unpaidFixed };
}

export function calcSafeToSpend(budget, totalSpentThisMonth, todaySpend = 0) {
  if (!budget) return 0;
  
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - now.getDate() + 1;
  
  const totalFixed = (budget?.fixedCosts ?? [])
    .reduce((sum, c) => sum + (c.amount ?? 0), 0)

  const remaining = (budget?.totalAllowance ?? 0)
    - totalFixed
    - (totalSpentThisMonth ?? 0)

  const safeToSpend = remaining / (daysRemaining ?? 1)
  
  // If spentToday > safeToSpend, the deficit math handles it logically
  return safeToSpend;
}

export function calcRunOutDays(budget, totalSpent, avgDailySpend) {
  if (!budget || avgDailySpend <= 0) return null;
  const totalFixed = (budget.fixedCosts || []).reduce((s, c) => s + c.amount, 0);
  const remaining = budget.totalAllowance - totalSpent - totalFixed;
  if (remaining <= 0) return 0;
  return Math.floor(remaining / avgDailySpend);
}

export function getSpendStatus(safeToSpend, todaySpend) {
  if (todaySpend <= safeToSpend) return 'safe';
  if (todaySpend <= safeToSpend * 1.1) return 'warning';
  return 'danger';
}
