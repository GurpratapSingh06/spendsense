const express = require('express');
const supabase = require('../utils/supabaseClient');
const auth = require('../middleware/authMiddleware');
const { authRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// REGISTER
router.post('/register', authRateLimiter, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Create auth user in Supabase
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        user_metadata: { name },
        email_confirm: true
      });
    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Insert into public.users profile table
    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        name,
        email: email.toLowerCase(),
        onboarding_done: false,
        settings: { soundEnabled: false }
      }]);
    if (profileError) {
      return res.status(400).json({ error: profileError.message });
    }

    // Create default streak row
    await supabase.from('streaks').insert([{ user_id: authData.user.id }]);

    // Sign in to get a session token
    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({ email: email.toLowerCase(), password });
    if (loginError) {
      return res.status(201).json({ message: 'Registered successfully. Please log in.' });
    }

    // Get profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    res.status(201).json({
      access_token: loginData.session.access_token,
      user: {
        id: authData.user.id,
        name: profile?.name || name,
        email: profile?.email || email.toLowerCase(),
        onboardingDone: profile?.onboarding_done || false,
        settings: profile?.settings || { soundEnabled: false }
      }
    });
  } catch (err) { next(err); }
});

// LOGIN
router.post('/login', authRateLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { data, error } =
      await supabase.auth.signInWithPassword({ email: email.toLowerCase(), password });
    if (error) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Get profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.json({
      access_token: data.session.access_token,
      user: {
        id: data.user.id,
        name: profile?.name || data.user.user_metadata.name,
        email: profile?.email || data.user.email,
        onboardingDone: profile?.onboarding_done || false,
        settings: profile?.settings || { soundEnabled: false }
      }
    });
  } catch (err) { next(err); }
});

// LOGOUT
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      // Sign out the user server-side
      await supabase.auth.admin.signOut(token);
    }
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    res.json({ message: 'Logged out successfully.' });
  }
});

// GET CURRENT USER
router.get('/me', auth, async (req, res, next) => {
  try {
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.userId)
      .single();
    if (error || !profile) {
      return res.status(401).json({ error: 'User not found' });
    }
    res.json({
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        onboardingDone: profile.onboarding_done,
        settings: profile.settings || { soundEnabled: false }
      }
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid session' });
  }
});

// COMPLETE ONBOARDING
router.put('/onboarding', auth, async (req, res, next) => {
  try {
    await supabase
      .from('users')
      .update({ onboarding_done: true })
      .eq('id', req.userId);
    res.json({ message: 'Onboarding completed' });
  } catch (err) { next(err); }
});

// UPDATE SETTINGS
router.put('/settings', auth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ settings: req.body.settings })
      .eq('id', req.userId)
      .select('settings')
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ settings: data.settings });
  } catch (err) { next(err); }
});

// GOOGLE OAUTH - Ensure profile exists after client-side Google login
router.post('/ensure-profile', auth, async (req, res) => {
  try {
    // Check if profile already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('id', req.userId)
      .single();

    if (existing) {
      return res.json({ exists: true });
    }

    // Get user details from Supabase Auth
    const { data: { user } } = await supabase.auth.admin.getUserById(req.userId);

    // Create profile
    await supabase.from('users').insert([{
      id: req.userId,
      name: user.user_metadata?.full_name || user.email.split('@')[0],
      email: user.email,
      onboarding_done: false
    }]);

    // Create default streak row
    await supabase.from('streaks').insert([{ user_id: req.userId }]);

    return res.json({ created: true });
  } catch (err) {
    return res.status(500).json({ error: 'Profile creation failed' });
  }
});

module.exports = router;
