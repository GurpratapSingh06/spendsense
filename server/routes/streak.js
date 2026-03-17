const express = require('express');
const supabase = require('../utils/supabaseClient');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// Helper: map Supabase fields to frontend-expected fields
const mapStreak = (row) => {
  if (!row) return row;
  return {
    ...row,
    _id: row.id,
    userId: row.user_id,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastLogDate: row.last_log_date,
    plantStage: row.plant_stage,
    thinkTwiceCount: row.think_twice_count
  };
};

router.get('/', auth, async (req, res, next) => {
  try {
    let { data, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', req.userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No streak row found — create one
      const { data: newStreak, error: insertError } = await supabase
        .from('streaks')
        .insert([{ user_id: req.userId }])
        .select()
        .single();
      if (insertError) return res.status(400).json({ error: insertError.message });
      return res.json(mapStreak(newStreak));
    }
    if (error) return res.status(400).json({ error: error.message });
    res.json(mapStreak(data));
  } catch (err) { next(err); }
});

router.put('/increment', auth, async (req, res, next) => {
  try {
    // Get or create streak
    let { data: streak, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', req.userId)
      .single();

    if (error && error.code === 'PGRST116') {
      const { data: newStreak } = await supabase
        .from('streaks')
        .insert([{ user_id: req.userId }])
        .select()
        .single();
      streak = newStreak;
    }
    if (!streak) return res.status(400).json({ error: 'Could not find or create streak' });

    const today = new Date().toDateString();
    const lastLog = streak.last_log_date
      ? new Date(streak.last_log_date).toDateString()
      : null;

    const updates = {};

    if (lastLog === today) {
      // Same day — only increment thinkTwiceCount
      updates.think_twice_count = (streak.think_twice_count || 0) + 1;
    } else {
      // New day — increment streak
      const newStreak = (streak.current_streak || 0) + 1;
      updates.current_streak = newStreak;
      updates.think_twice_count = (streak.think_twice_count || 0) + 1;
      if (newStreak > (streak.longest_streak || 0)) {
        updates.longest_streak = newStreak;
      }
      updates.last_log_date = new Date().toISOString().split('T')[0];
      updates.plant_stage = Math.min(5, Math.floor(newStreak / 3) + 1);
    }

    const { data: updated, error: updateError } = await supabase
      .from('streaks')
      .update(updates)
      .eq('user_id', req.userId)
      .select()
      .single();
    if (updateError) return res.status(400).json({ error: updateError.message });
    res.json(mapStreak(updated));
  } catch (err) { next(err); }
});

router.put('/reset', auth, async (req, res, next) => {
  try {
    // Get or create streak
    let { data: streak, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', req.userId)
      .single();

    if (error && error.code === 'PGRST116') {
      const { data: newStreak } = await supabase
        .from('streaks')
        .insert([{ user_id: req.userId }])
        .select()
        .single();
      streak = newStreak;
    }
    if (!streak) return res.status(400).json({ error: 'Could not find or create streak' });

    const { data: updated, error: updateError } = await supabase
      .from('streaks')
      .update({
        current_streak: 0,
        plant_stage: 1,
        last_log_date: new Date().toISOString().split('T')[0]
      })
      .eq('user_id', req.userId)
      .select()
      .single();
    if (updateError) return res.status(400).json({ error: updateError.message });
    res.json(mapStreak(updated));
  } catch (err) { next(err); }
});

module.exports = router;
