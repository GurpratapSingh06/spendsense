const express = require('express');
const auth = require('../middleware/authMiddleware');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { askGroq } = require('../utils/groqClient');
const supabase = require('../utils/supabaseClient');

const router = express.Router();



router.post('/think-twice', auth, aiRateLimiter, async (req, res, next) => {
  try {
    const { item, amount } = req.body;
    if (!item || !amount) {
      return res.status(400).json({ error: 'Please provide an item and amount.' });
    }

    const now = new Date();

    // Get budget for current month
    const { data: budget } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', req.userId)
      .eq('month', now.getMonth() + 1)
      .eq('year', now.getFullYear())
      .single();

    // Get today's expenses total
    const todayStr = now.toISOString().split('T')[0];
    const { data: todayExpenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', req.userId)
      .eq('date', todayStr);

    // Get month's expenses by category
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data: monthExpensesRaw } = await supabase
      .from('expenses')
      .select('amount, category')
      .eq('user_id', req.userId)
      .gte('date', monthStart)
      .lte('date', monthEnd);

    // Aggregate by category
    const catTotals = {};
    let totalSpentThisMonth = 0;
    (monthExpensesRaw || []).forEach(e => {
      const amt = Number(e.amount);
      catTotals[e.category] = (catTotals[e.category] || 0) + amt;
      totalSpentThisMonth += amt;
    });

    // Sort categories by total descending
    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

    const totalAllowance = budget ? Number(budget.total_allowance) : 10000;

    const totalFixed = (budget?.fixed_costs ?? [])
      .reduce((sum, c) => sum + (c.amount ?? 0), 0);

    const remaining = (budget ? Number(budget.total_allowance) : 0)
      - totalFixed
      - (totalSpentThisMonth ?? 0);

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - now.getDate() + 1;

    const safeToSpend = Math.max(0, Math.round(remaining / (daysLeft ?? 1)));
    const topCat = sortedCats.length > 0 ? sortedCats[0][0] : 'Food';

    const systemPrompt = "You are a blunt, friendly financial coach for an Indian college student. Always respond in exactly 2 sentences. End with either 'Worth it.' or 'Think twice.' on its own line. Never use bullet points or intro phrases.";
    const userPrompt = `Student has ₹${safeToSpend} safe to spend today. They want to spend ₹${amount} on ${item}. Top overspend category this month: ${topCat}. Compare this cost to something tangible like home-cooked meals, study hours, or % of their weekly budget.`;

    const response = await askGroq(systemPrompt, userPrompt);
    res.json({ response, safeToSpend });
  } catch (err) { next(err); }
});

router.post('/daily-insight', auth, aiRateLimiter, async (req, res, next) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ 
        error: 'GROQ_API_KEY not configured' 
      });
    }
    // Get user profile for cached tip
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.userId)
      .single();

    const today = new Date().toDateString();

    if (user?.ai_tip && user?.ai_tip_date &&
        new Date(user.ai_tip_date).toDateString() === today) {
      return res.json({ tip: user.ai_tip, cached: true });
    }

    const now = new Date();

    // Get budget
    const { data: budget } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', req.userId)
      .eq('month', now.getMonth() + 1)
      .eq('year', now.getFullYear())
      .single();

    // Get month expenses
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data: monthExpensesRaw } = await supabase
      .from('expenses')
      .select('amount, category')
      .eq('user_id', req.userId)
      .gte('date', monthStart)
      .lte('date', monthEnd);

    const totalBudget = budget ? Number(budget.total_allowance) : 10000;

    const catSpent = {};
    let totalSpent = 0;
    (monthExpensesRaw || []).forEach(e => {
      const amt = Number(e.amount);
      catSpent[e.category] = (catSpent[e.category] || 0) + amt;
      totalSpent += amt;
    });

    const totalFixed = (budget?.fixed_costs ?? [])
      .reduce((sum, c) => sum + (c.amount ?? 0), 0);

    const remaining = (budget ? Number(budget.total_allowance) : 0)
      - totalFixed
      - (totalSpent ?? 0);

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - now.getDate() + 1;

    const systemPrompt = "You are a friendly financial coach for an Indian college student. Give exactly ONE actionable tip in 2 sentences. Use ₹ for currency. No bullet points. No intro phrase. Just the tip directly.";
    const userPrompt = `Monthly budget: ₹${totalBudget}\nTotal spent: ₹${totalSpent}\nRemaining: ₹${remaining}\nDays left: ${daysLeft}\nSpending by category: ${JSON.stringify(catSpent)}`;

    const tip = await askGroq(systemPrompt, userPrompt);

    // Cache the tip
    await supabase
      .from('users')
      .update({
        ai_tip: tip,
        ai_tip_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', req.userId);

    res.json({ tip, cached: false });
  } catch (err) { next(err); }
});

module.exports = router;
