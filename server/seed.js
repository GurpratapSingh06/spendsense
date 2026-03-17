require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function seed() {
  try {
    console.log('Connecting to Supabase...');

    // Clean existing demo data — find user by email
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'demo@spendsense.in');

    if (existingUsers && existingUsers.length > 0) {
      const userId = existingUsers[0].id;
      await supabase.from('expenses').delete().eq('user_id', userId);
      await supabase.from('budgets').delete().eq('user_id', userId);
      await supabase.from('goals').delete().eq('user_id', userId);
      await supabase.from('streaks').delete().eq('user_id', userId);
      await supabase.from('users').delete().eq('id', userId);
      // Delete auth user too
      await supabase.auth.admin.deleteUser(userId);
      console.log('Cleaned existing demo data');
    }

    // Create demo auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: 'demo@spendsense.in',
        password: 'demo1234',
        user_metadata: { name: 'Arjun Sharma' },
        email_confirm: true
      });
    if (authError) {
      console.error('Error creating auth user:', authError.message);
      process.exit(1);
    }
    const userId = authData.user.id;

    // Insert profile
    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        id: userId,
        name: 'Arjun Sharma',
        email: 'demo@spendsense.in',
        onboarding_done: true,
        settings: { soundEnabled: false }
      }]);
    if (profileError) {
      console.error('Error creating profile:', profileError.message);
      process.exit(1);
    }
    console.log('Created demo user: demo@spendsense.in / demo1234');

    // Budget: ₹10,000 total with smart category defaults
    const now = new Date();
    const { error: budgetError } = await supabase
      .from('budgets')
      .insert([{
        user_id: userId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        total_allowance: 10000,
        starting_balance: 10000,
        fixed_costs: [],
        fixed_costs_paid: [],
        category_limits: {
          Food: 3500,
          Transport: 1500,
          Study: 1500,
          Entertainment: 1500,
          Health: 1000,
          Other: 1000
        }
      }]);
    if (budgetError) {
      console.error('Error creating budget:', budgetError.message);
      process.exit(1);
    }
    console.log('Created budget: ₹10,000');

    // 5 expenses spread across current month
    const expenses = [
      {
        user_id: userId,
        description: 'College Canteen',
        amount: 120,
        category: 'Food',
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4).toISOString().split('T')[0],
        note: ''
      },
      {
        user_id: userId,
        description: 'Auto to college',
        amount: 60,
        category: 'Transport',
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3).toISOString().split('T')[0],
        note: ''
      },
      {
        user_id: userId,
        description: 'Xerox notes',
        amount: 40,
        category: 'Study',
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2).toISOString().split('T')[0],
        note: ''
      },
      {
        user_id: userId,
        description: 'Movie tickets',
        amount: 250,
        category: 'Entertainment',
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString().split('T')[0],
        note: ''
      },
      {
        user_id: userId,
        description: 'Pharmacy meds',
        amount: 80,
        category: 'Health',
        date: new Date().toISOString().split('T')[0],
        note: ''
      }
    ];
    const { error: expError } = await supabase.from('expenses').insert(expenses);
    if (expError) {
      console.error('Error creating expenses:', expError.message);
      process.exit(1);
    }
    console.log('Created 5 curated expenses');

    // 1 savings goal
    const { error: goalError } = await supabase
      .from('goals')
      .insert([{
        user_id: userId,
        name: 'New Laptop',
        target_amount: 15000,
        saved_amount: 3000,
        target_date: new Date(now.getFullYear(), now.getMonth() + 4, 1).toISOString().split('T')[0]
      }]);
    if (goalError) {
      console.error('Error creating goal:', goalError.message);
      process.exit(1);
    }
    console.log('Created goal: New Laptop (₹3,000/₹15,000)');

    // Streak
    const { error: streakError } = await supabase
      .from('streaks')
      .insert([{
        user_id: userId,
        current_streak: 2,
        longest_streak: 2,
        last_log_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString().split('T')[0],
        plant_stage: 1,
        think_twice_count: 2
      }]);
    if (streakError) {
      console.error('Error creating streak:', streakError.message);
      process.exit(1);
    }
    console.log('Created streak: 2 days, plant stage 1 (seed)');

    console.log('\n✅ Seed complete!');
    console.log('Login: demo@spendsense.in / demo1234');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
