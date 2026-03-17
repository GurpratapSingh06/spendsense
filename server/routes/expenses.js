const express = require('express');
const supabase = require('../utils/supabaseClient');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// Helper: map Supabase `id` to `_id` for frontend compat
const addMongoId = (row) => {
  if (!row) return row;
  return { ...row, _id: row.id };
};

router.get('/', auth, async (req, res, next) => {
  try {
    const { month, year, category, search, sortBy, sortOrder, minAmount, maxAmount } = req.query;

    let query = supabase.from('expenses').select('*')
      .eq('user_id', req.userId);

    if (month && year && month !== 'all') {
      const m = String(month).padStart(2, '0');
      const lastDay = new Date(year, month, 0).getDate();
      query = query
        .gte('date', `${year}-${m}-01`)
        .lte('date', `${year}-${m}-${String(lastDay).padStart(2, '0')}`);
    }
    if (category) query = query.eq('category', category);
    if (search) {
      query = query.or(`description.ilike.%${search}%,note.ilike.%${search}%`);
    }
    if (minAmount) query = query.gte('amount', Number(minAmount));
    if (maxAmount) query = query.lte('amount', Number(maxAmount));

    // Sorting
    if (sortBy) {
      const col = sortBy === 'createdAt' ? 'created_at' : sortBy;
      query = query.order(col, { ascending: sortOrder === 'asc' });
    } else {
      query = query.order('date', { ascending: false })
                    .order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json((data || []).map(addMongoId));
  } catch (err) { next(err); }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const { description, amount, category, date, note } = req.body;
    if (!description || description.length < 2) {
      return res.status(400).json({ error: 'Description must be at least 2 characters.' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0.' });
    }
    if (!category) {
      return res.status(400).json({ error: 'Please select a category.' });
    }
    const expenseDate = date ? new Date(date) : new Date();
    if (expenseDate > new Date()) {
      return res.status(400).json({ error: 'Expense date cannot be in the future.' });
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert([{
        user_id: req.userId,
        description: description.trim(),
        amount,
        category,
        date: expenseDate.toISOString().split('T')[0],
        note: note || ''
      }])
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(addMongoId(data));
  } catch (err) { next(err); }
});

router.put('/:id', auth, async (req, res, next) => {
  try {
    // First check if it exists and belongs to user
    const { data: existing, error: findError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();
    if (findError || !existing) {
      return res.status(404).json({ error: 'Expense not found.' });
    }

    const { description, amount, category, date, note } = req.body;
    const updates = {};
    if (description !== undefined) {
      if (description.length < 2) return res.status(400).json({ error: 'Description must be at least 2 characters.' });
      updates.description = description.trim();
    }
    if (amount !== undefined) {
      if (amount <= 0) return res.status(400).json({ error: 'Amount must be greater than 0.' });
      updates.amount = amount;
    }
    if (category !== undefined) updates.category = category;
    if (date !== undefined) {
      const d = new Date(date);
      if (d > new Date()) return res.status(400).json({ error: 'Date cannot be in the future.' });
      updates.date = d.toISOString().split('T')[0];
    }
    if (note !== undefined) updates.note = note;

    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(addMongoId(data));
  } catch (err) { next(err); }
});

router.delete('/bulk', auth, async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Please select expenses to delete.' });
    }
    const { error, count } = await supabase
      .from('expenses')
      .delete({ count: 'exact' })
      .in('id', ids)
      .eq('user_id', req.userId);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ deleted: count || ids.length });
  } catch (err) { next(err); }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    // Check exists first
    const { data: existing } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found.' });
    }
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Expense deleted.', expense: addMongoId(existing) });
  } catch (err) { next(err); }
});

module.exports = router;
