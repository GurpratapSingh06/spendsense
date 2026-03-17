const express = require('express');
const supabase = require('../utils/supabaseClient');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// Helper: map Supabase fields to frontend-expected fields
const mapGoal = (row) => {
  if (!row) return row;
  return {
    ...row,
    _id: row.id,
    userId: row.user_id,
    targetAmount: Number(row.target_amount),
    savedAmount: Number(row.saved_amount),
    targetDate: row.target_date,
    completedAt: row.completed_at,
    createdAt: row.created_at
  };
};

router.get('/', auth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json((data || []).map(mapGoal));
  } catch (err) { next(err); }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const { name, targetAmount, savedAmount, targetDate } = req.body;
    if (!name || !targetAmount) {
      return res.status(400).json({ error: 'Goal name and target amount are required.' });
    }
    if (targetAmount <= 0) {
      return res.status(400).json({ error: 'Target amount must be greater than 0.' });
    }
    const { data, error } = await supabase
      .from('goals')
      .insert([{
        user_id: req.userId,
        name,
        target_amount: targetAmount,
        saved_amount: savedAmount || 0,
        target_date: targetDate || null
      }])
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(mapGoal(data));
  } catch (err) { next(err); }
});

router.put('/:id', auth, async (req, res, next) => {
  try {
    // Check goal exists and belongs to user
    const { data: existing, error: findError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();
    if (findError || !existing) {
      return res.status(404).json({ error: 'Goal not found.' });
    }

    const { name, targetAmount, savedAmount, targetDate } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (targetAmount !== undefined) updates.target_amount = targetAmount;
    if (savedAmount !== undefined) {
      updates.saved_amount = savedAmount;
      const effectiveTarget = targetAmount !== undefined ? targetAmount : Number(existing.target_amount);
      if (savedAmount >= effectiveTarget && !existing.completed_at) {
        updates.completed_at = new Date().toISOString();
      }
    }
    if (targetDate !== undefined) updates.target_date = targetDate;

    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(mapGoal(data));
  } catch (err) { next(err); }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const { data: existing } = await supabase
      .from('goals')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();
    if (!existing) {
      return res.status(404).json({ error: 'Goal not found.' });
    }
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Goal deleted.', goal: mapGoal(existing) });
  } catch (err) { next(err); }
});

module.exports = router;
