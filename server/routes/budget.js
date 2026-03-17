const express = require('express');
const supabase = require('../utils/supabaseClient');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// Helper: map Supabase fields to Mongoose-style fields for frontend
const mapBudget = (row) => {
  if (!row) return null;
  return {
    ...row,
    _id: row.id,
    userId: row.user_id,
    totalAllowance: Number(row.total_allowance),
    startingBalance: Number(row.starting_balance),
    fixedCosts: row.fixed_costs || [],
    fixedCostsPaid: row.fixed_costs_paid || [],
    categoryLimits: row.category_limits || {}
  };
};

router.get('/', auth, async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || (now.getMonth() + 1);
    const year = parseInt(req.query.year) || now.getFullYear();

    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', req.userId)
      .eq('month', month)
      .eq('year', year)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine (return null)
      return res.status(400).json({ error: error.message });
    }
    res.json(mapBudget(data));
  } catch (err) { next(err); }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const { month, year, totalAllowance, startingBalance, fixedCosts, categoryLimits } = req.body;
    const now = new Date();
    const m = month || (now.getMonth() + 1);
    const y = year || now.getFullYear();

    if (!totalAllowance || totalAllowance <= 0) {
      return res.status(400).json({ error: 'Total allowance must be greater than 0.' });
    }

    const { data, error } = await supabase
      .from('budgets')
      .upsert({
        user_id: req.userId,
        month: m,
        year: y,
        total_allowance: totalAllowance,
        starting_balance: startingBalance || totalAllowance,
        fixed_costs: fixedCosts || [],
        fixed_costs_paid: [],
        category_limits: categoryLimits || {}
      }, { onConflict: 'user_id,month,year' })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(mapBudget(data));
  } catch (err) { next(err); }
});

router.put('/fixed-costs/:name/pay', auth, async (req, res, next) => {
  try {
    const { name } = req.params;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const { data: budget, error: findError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', req.userId)
      .eq('month', month)
      .eq('year', year)
      .single();

    if (findError || !budget) {
      return res.status(404).json({ error: 'Budget not found for this month' });
    }

    const paid = budget.fixed_costs_paid || [];
    if (paid.some(f => f.name === name)) {
      return res.status(400).json({ error: 'Already marked paid' });
    }

    paid.push({ name, paidAt: now.toISOString() });

    const { data, error } = await supabase
      .from('budgets')
      .update({ fixed_costs_paid: paid })
      .eq('id', budget.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(mapBudget(data));
  } catch (err) { next(err); }
});

router.put('/fixed-costs/:name/unpay', auth, async (req, res, next) => {
  try {
    const { name } = req.params;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const { data: budget, error: findError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', req.userId)
      .eq('month', month)
      .eq('year', year)
      .single();

    if (findError || !budget) {
      return res.status(404).json({ error: 'Budget not found for this month' });
    }

    const filtered = (budget.fixed_costs_paid || []).filter(f => f.name !== name);

    const { data, error } = await supabase
      .from('budgets')
      .update({ fixed_costs_paid: filtered })
      .eq('id', budget.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(mapBudget(data));
  } catch (err) { next(err); }
});

module.exports = router;
