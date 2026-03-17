import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBudget } from '../hooks/useBudget';
import { useExpenses } from '../hooks/useExpenses';
import AddExpenseModal from '../components/modals/AddExpense';
import ThinkTwiceModal from '../components/modals/ThinkTwice';
import OnboardingModal from '../components/modals/Onboarding';
import { useToast } from '../hooks/useToast';
import { useStreak } from '../hooks/useStreak';
import { formatCurrency } from '../utils/formatCurrency';
import api from '../utils/api';
import { LayoutDashboard, Receipt, Wallet, Target, BarChart2, Search, Bell, Brain, LogOut, SearchX, AlertTriangle, XCircle, TrendingUp, CheckCircle, User, Settings, Plus, Coins, Landmark, PiggyBank, SlidersHorizontal } from 'lucide-react';
import { CATEGORY_MAP } from '../constants/categories';

const formatShortDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

const SEARCH_NAV_ITEMS = [
  { type: 'page', title: 'Dashboard', subtitle: 'Your spending overview', icon: LayoutDashboard, path: '/' },
  { type: 'page', title: 'Expenses', subtitle: 'Log and manage expenses', icon: Receipt, path: '/expenses' },
  { type: 'page', title: 'Budget', subtitle: 'Set monthly limits and fixed costs', icon: Wallet, path: '/budget' },
  { type: 'page', title: 'Goals', subtitle: 'Track your savings goals', icon: Target, path: '/goals' },
  { type: 'page', title: 'Analytics', subtitle: 'Spending charts and reports', icon: BarChart2, path: '/analytics' },
  { type: 'feature', title: 'Add Expense', subtitle: 'Log a new expense quickly', icon: Plus, action: 'openAddExpense' },
  { type: 'feature', title: 'Think Twice', subtitle: 'AI impulse control check', icon: Brain, action: 'openThinkTwice' },
  { type: 'feature', title: 'Safe to Spend', subtitle: 'Your daily spending limit', icon: Coins, path: '/' },
  { type: 'feature', title: 'Fixed Costs', subtitle: 'Rent, subscriptions and bills', icon: Landmark, path: '/budget' },
  { type: 'feature', title: 'Savings Goals', subtitle: 'Save toward something', icon: PiggyBank, path: '/goals' },
  { type: 'feature', title: 'Category Limits', subtitle: 'Per-category budget limits', icon: SlidersHorizontal, path: '/budget' }
];

const NAV_ITEMS = [
  { path: '/', iconComponent: LayoutDashboard, label: 'Dashboard' },
  { path: '/expenses', iconComponent: Receipt, label: 'Expenses' },
  { path: '/budget', iconComponent: Wallet, label: 'Budget' },
  { path: '/goals', iconComponent: Target, label: 'Goals' },
  { path: '/analytics', iconComponent: BarChart2, label: 'Analytics' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { budget, saveBudget } = useBudget();
  const { expenses, addExpense, totalSpent } = useExpenses();
  const { success, error: showError } = useToast();
  const { streak, incrementStreak } = useStreak();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showThinkTwice, setShowThinkTwice] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [lastCategory, setLastCategory] = useState('Food');
  const [fabHover, setFabHover] = useState(false);

  // --- Header States ---
  const [activeDropdown, setActiveDropdown] = useState(null);
  const headerRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ pages: [], expenses: [], goals: [] });
  const [isSearching, setIsSearching] = useState(false);
  
  const [notifications, setNotifications] = useState([]);

  // Search Debounce
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Perform Search
  useEffect(() => {
    if (debouncedQuery.length >= 2 && activeDropdown === 'search') {
      const fetchSearch = async () => {
        setIsSearching(true);
        try {
          // Static Nav filtering
          const q = debouncedQuery.toLowerCase();
          const matchedNav = SEARCH_NAV_ITEMS.filter(item => 
             item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)
          );

          const [expRes, goalsRes] = await Promise.all([
            api.get(`/api/expenses?search=${encodeURIComponent(debouncedQuery)}&month=all`, { withCredentials: true }),
            api.get('/api/goals', { withCredentials: true })
          ]);
          
          let filteredGoals = [];
          if (goalsRes.data && Array.isArray(goalsRes.data)) {
             filteredGoals = goalsRes.data.filter(g => g.name.toLowerCase().includes(q));
          }
          setSearchResults({ pages: matchedNav, expenses: expRes.data || [], goals: filteredGoals });
        } catch (err) {
           console.error('Search error:', err);
        } finally {
          setIsSearching(false);
        }
      };
      fetchSearch();
    } else if (debouncedQuery.length < 2) {
      setSearchResults({ pages: [], expenses: [], goals: [] });
    }
  }, [debouncedQuery, activeDropdown]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) setActiveDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Escape to close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setActiveDropdown(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Calculate Notifications
  useEffect(() => {
    const alerts = [];
    if (budget && budget.categoryLimits) {
      const catSpent = {};
      expenses.forEach(e => {
         catSpent[e.category] = (catSpent[e.category] || 0) + e.amount;
      });
      Object.entries(budget.categoryLimits).forEach(([cat, limit]) => {
         if (!limit) return;
         const spent = catSpent[cat] || 0;
         const pct = (spent / limit) * 100;
         if (pct >= 100) {
           alerts.push({ type: 'OVER', title: `${cat} limit exceeded!`, sub: `₹${spent.toLocaleString('en-IN')} spent — ₹${(spent - limit).toLocaleString('en-IN')} over limit` });
         } else if (pct >= 85) {
           alerts.push({ type: 'HIGH', title: `${cat} almost maxed`, sub: `₹${spent.toLocaleString('en-IN')} spent of ₹${limit.toLocaleString('en-IN')} limit` });
         } else if (pct >= 70) {
           alerts.push({ type: 'WARNING', title: `${cat} budget at ${Math.round(pct)}%`, sub: `₹${spent.toLocaleString('en-IN')} spent of ₹${limit.toLocaleString('en-IN')} limit` });
         }
      });
    }

    if (budget && budget.totalAllowance > 0) {
      const pct = (totalSpent / budget.totalAllowance) * 100;
      if (pct >= 100) alerts.push({ type: 'OVER', title: `Total budget exceeded!`, sub: `₹${totalSpent.toLocaleString('en-IN')} spent of ₹${budget.totalAllowance.toLocaleString('en-IN')} limit` });
      else if (pct >= 85) alerts.push({ type: 'HIGH', title: `Total budget almost maxed`, sub: `₹${totalSpent.toLocaleString('en-IN')} spent of ₹${budget.totalAllowance.toLocaleString('en-IN')} limit` });
      else if (pct >= 70) alerts.push({ type: 'WARNING', title: `Total budget at ${Math.round(pct)}%`, sub: `₹${totalSpent.toLocaleString('en-IN')} spent of ₹${budget.totalAllowance.toLocaleString('en-IN')} limit` });
      
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysLeft = daysInMonth - now.getDate() + 1;
      const totalFixed = (budget.fixedCosts || []).reduce((s, c) => s + c.amount, 0);
      const remaining = budget.totalAllowance - totalFixed - totalSpent;
      const safeToSpend = Math.max(0, Math.round(remaining / (daysLeft || 1)));
      
      const uniqueDays = new Set(expenses.map(e => new Date(e.date).toDateString())).size;
      const dailyAvg = uniqueDays > 0 ? Math.round(totalSpent / uniqueDays) : 0;
      
      if (dailyAvg > safeToSpend && safeToSpend > 0) {
         alerts.push({ type: 'SAFE_WARNING', title: `Daily average above safe limit`, sub: `Spending ₹${dailyAvg.toLocaleString('en-IN')}/day vs ₹${safeToSpend.toLocaleString('en-IN')} safe limit` });
      }
    }
    setNotifications(alerts);
  }, [budget, expenses, totalSpent]);

  useEffect(() => {
    if (user && !user.onboardingDone) {
      setShowOnboarding(true);
    }
  }, [user]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'n' || e.key === 'N') {
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        setShowAddExpense(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleAddExpense = async (expense) => {
    try {
      await addExpense(expense);
      setLastCategory(expense.category);
      setShowAddExpense(false);
      success('Expense added!');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to add expense.');
    }
  };

  const handleThinkTwiceSkip = async () => {
    try {
      await incrementStreak();
      success('Great self-control! Streak updated');
    } catch { /* silent */ }
  };

  const handleThinkTwiceBuy = async (expense) => {
    try {
      await addExpense({ ...expense, category: 'Other', date: new Date().toISOString().split('T')[0] });
      success('Expense logged.');
    } catch { /* silent */ }
  };

  const handleOnboardingComplete = async (data) => {
    setShowOnboarding(false);
    if (data.allowance) {
      try {
        const limits = data.limits || {};
        await saveBudget({
          totalAllowance: data.allowance,
          startingBalance: data.allowance,
          fixedCosts: [],
          categoryLimits: limits,
        });
      } catch { /* silent */ }
    }
    if (data.goal) {
      try {
        await api.post('/api/goals', {
          name: data.goal.name,
          targetAmount: parseFloat(data.goal.target) || 5000,
        }, { withCredentials: true });
      } catch { /* silent */ }
    }
    success('Setup complete! Start tracking your expenses');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-bg flex font-display text-primary">
      {/* Expanding Sidebar (Desktop) — 64px → 220px on hover */}
      <aside className="sticky left-0 top-0 h-screen flex-shrink-0 bg-surface border-r border-divider z-40 transition-all duration-300 w-16 hover:w-[220px] overflow-hidden group sidebar-desktop">
        <div className="h-full flex flex-col justify-between py-6">
          <div className="flex flex-col gap-8 px-3">
            {/* Logo */}
            <div className="flex items-center gap-4 px-1">
              <div className="w-8 h-8 flex-shrink-0 bg-accent rounded-lg shadow-sm flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-display font-bold text-lg text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                SpendSense
              </span>
            </div>
            
            {/* Nav Items — 40x40px zones, 20px SVG icons */}
            <nav className="flex flex-col gap-2">
              {NAV_ITEMS.map(item => {
                const IconComp = item.iconComponent;
                return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-4 p-2 rounded-[10px] transition-colors relative ${
                      isActive
                        ? 'bg-[#FFF3E8] text-accent'
                        : 'text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151]'
                    }`
                  }
                  title={item.label}
                >
                  <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                    <IconComp size={18} strokeWidth={1.5} />
                  </div>
                  <span className="font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    {item.label}
                  </span>
                </NavLink>
              )})}
            </nav>
          </div>

          {/* User Avatar Bottom */}
          <div className="px-3">
            <div className="flex items-center gap-3 p-2 cursor-pointer hover:bg-[#F3F4F6] rounded-lg transition-colors" onClick={handleLogout} title="Logout">
              <div className="w-8 h-8 flex-shrink-0 rounded-full bg-surface-2 border border-divider flex items-center justify-center text-primary text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                <span className="text-sm font-semibold text-primary">{user?.name}</span>
                <span className="text-xs text-secondary flex items-center gap-1"><LogOut size={12} strokeWidth={1.5} /> Sign out</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav — white, shadow-top, 44x44px touch targets */}
      <nav className="mobile-nav fixed bottom-0 left-0 right-0 bg-surface border-t border-divider z-40 justify-around items-center py-2 px-1 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]" style={{ display: 'none' }}>
        {NAV_ITEMS.map(item => {
          const IconComp = item.iconComponent;
          return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center transition-colors ${
                isActive ? 'text-accent' : 'text-secondary'
              }`
            }
          >
            <IconComp size={20} strokeWidth={1.5} />
          </NavLink>
        )})}
      </nav>

      {/* Main Content Area — 32px padding */}
      <main className="flex-1 min-w-0 transition-all duration-300 min-h-screen flex flex-col pt-2 md:pt-8 pb-24 md:pb-8 px-3 md:px-8 overflow-y-auto">
        
        {/* Top Header Row */}
        <header ref={headerRef} className="relative flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-8 gap-4 z-40 min-h-[56px]">
          <div className="flex-1 w-full md:w-auto">
            <h1 className="text-[18px] md:text-[28px] font-extrabold text-primary mb-2 md:mb-1">
              {(() => {
                const firstName = user?.name ? user.name.split(' ')[0] : 'User';
                const createdAt = new Date(user?.created_at);
                const diffMinutes = (new Date() - createdAt) / 1000 / 60;
                return diffMinutes < 5
                  ? `Welcome, ${firstName}! 👋`
                  : `Welcome back, ${firstName}!`;
              })()}
            </h1>
            <p className="text-[14px] text-secondary hidden md:block">
              Here is what's happening with your money today.
            </p>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 absolute md:relative right-0 top-0">
            {/* Search */}
            <div className="relative flex items-center">
              {/* Mobile Search Icon Toggle */}
              <button
                className={`md:hidden flex items-center justify-center w-8 h-8 rounded-full text-secondary hover:text-primary transition-colors ${activeDropdown === 'search' ? 'bg-[#F3F4F6] text-primary' : ''}`}
                onClick={() => {
                  if (activeDropdown === 'search') setActiveDropdown(null);
                  else setActiveDropdown('search');
                }}
              >
                <Search size={16} strokeWidth={1.5} />
              </button>

              <div className={`absolute right-full mr-2 top-1/2 -translate-y-1/2 md:relative md:right-auto md:top-auto md:translate-y-0 md:flex items-center transition-all ${activeDropdown === 'search' ? 'flex w-[200px]' : 'hidden w-0 md:w-auto'}`}>
                <input
                  type="text"
                  placeholder="Search module..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.length >= 2) setActiveDropdown('search');
                    else if (e.target.value.length < 2 && activeDropdown === 'search') setActiveDropdown(null);
                  }}
                  onFocus={() => { if (searchQuery.length >= 2) setActiveDropdown('search'); }}
                  className="!bg-[#F3F4F6] !border-none !rounded-full !py-2 !pl-4 !pr-10 text-sm w-full md:w-48 md:focus:!w-64 transition-all focus:ring-0 shadow-lg md:shadow-none"
                  autoFocus={activeDropdown === 'search' && window.innerWidth <= 768}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none hidden md:block"><Search size={16} strokeWidth={1.5} /></span>
              </div>
              
              {/* Search Dropdown */}
              {activeDropdown === 'search' && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-[320px] bg-white rounded-[12px] shadow-lg overflow-y-auto max-h-[380px] z-[1000] border border-divider">
                  {isSearching ? (
                    <div className="p-4 space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3 animate-pulse">
                          <div className="w-8 h-8 bg-[#F3F4F6] rounded-lg"></div>
                          <div className="flex-1 space-y-2 py-1">
                            <div className="h-4 bg-[#F3F4F6] rounded w-2/3"></div>
                            <div className="h-3 bg-[#F3F4F6] rounded w-1/3"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (searchResults.pages.length === 0 && searchResults.expenses.length === 0 && searchResults.goals.length === 0) ? (
                    <div className="p-6 flex flex-col items-center justify-center text-center">
                      <SearchX size={32} color="#D1D5DB" strokeWidth={1.5} className="mb-4" />
                      <p className="text-[12px] text-[#9CA3AF]">No results for "{searchQuery}"</p>
                    </div>
                  ) : (
                    <div className="py-2 flex flex-col">
                      {searchResults.pages.length > 0 && (
                         <div className="flex flex-col">
                           <div className="text-[10px] uppercase text-[#9CA3AF] tracking-[0.1em] px-4 py-2 mt-1 bg-[#F9FAFB] first:mt-0 font-bold">── PAGES & FEATURES ({searchResults.pages.length}) ───────────────</div>
                           {searchResults.pages.map((p, i) => (
                             <div 
                               key={`page-${i}`} 
                               onClick={() => { 
                                 setActiveDropdown(null); 
                                 if (p.action === 'openAddExpense') setShowAddExpense(true);
                                 else if (p.action === 'openThinkTwice') setShowThinkTwice(true);
                                 else if (p.path) navigate(p.path); 
                               }} 
                               className="px-4 py-2.5 hover:bg-[#F9FAFB] cursor-pointer flex items-center gap-3 border-b border-[#F3F4F6] last:border-b-0"
                             >
                               <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                                  <p.icon size={16} color="#6B7280" strokeWidth={1.5} />
                               </div>
                               <div className="flex-1 min-w-0 flex flex-col justify-center">
                                 <div className="text-sm font-semibold text-primary truncate mb-0.5">{p.title}</div>
                                 <div className="text-[12px] text-secondary truncate">{p.subtitle}</div>
                               </div>
                             </div>
                           ))}
                         </div>
                      )}

                      {searchResults.expenses.length > 0 && (
                         <div className="flex flex-col">
                           <div className="text-[10px] uppercase text-[#9CA3AF] tracking-[0.1em] px-4 py-2 mt-1 bg-[#F9FAFB] first:mt-0 font-bold">── EXPENSES ({searchResults.expenses.length}) ──────────────────────</div>
                           {searchResults.expenses.map(exp => {
                             const catMapDetails = CATEGORY_MAP[exp.category] || {};
                             const CatIcon = catMapDetails.icon || Receipt;
                             const color = catMapDetails.color || '#374151';
                             return (
                               <div key={exp._id} onClick={() => { setActiveDropdown(null); navigate('/expenses'); }} className="px-4 py-2.5 hover:bg-[#F9FAFB] cursor-pointer flex items-center gap-3 border-b border-[#F3F4F6] last:border-b-0">
                                 <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                                    <CatIcon size={16} color={color} strokeWidth={1.5} />
                                 </div>
                                 <div className="flex-1 min-w-0 flex flex-col justify-center">
                                   <div className="flex justify-between items-center mb-0.5 max-w-full">
                                      <span className="text-sm font-semibold text-primary truncate pr-2 flex-shrink">{exp.description}</span>
                                      <span className="text-sm font-mono-amounts text-primary flex-shrink-0">-₹{exp.amount.toLocaleString('en-IN')}</span>
                                   </div>
                                   <div className="text-[12px] text-secondary truncate">{exp.category} · {formatShortDate(exp.date)}</div>
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                      )}
                      
                      {searchResults.goals.length > 0 && (
                         <div className="flex flex-col">
                           <div className="text-[10px] uppercase text-[#9CA3AF] tracking-[0.1em] px-4 py-2 mt-1 bg-[#F9FAFB] first:mt-0 font-bold">── GOALS ({searchResults.goals.length}) ───────────────────────────────</div>
                           {searchResults.goals.map(goal => (
                               <div key={goal._id} onClick={() => { setActiveDropdown(null); navigate('/goals'); }} className="px-4 py-2.5 hover:bg-[#F9FAFB] cursor-pointer flex items-center gap-3 border-b border-[#F3F4F6] last:border-b-0">
                                 <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                                    <Target size={16} color="#F97316" strokeWidth={1.5} />
                                 </div>
                                 <div className="flex-1 min-w-0 flex flex-col justify-center">
                                   <div className="text-sm font-semibold text-primary truncate mb-0.5">{goal.name}</div>
                                   <div className="text-[12px] text-secondary truncate">₹{(goal.savedAmount || 0).toLocaleString('en-IN')} of ₹{goal.targetAmount.toLocaleString('en-IN')} saved</div>
                                 </div>
                               </div>
                           ))}
                         </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Notification bell */}
            <div className="relative">
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'notifications' ? null : 'notifications')} 
                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#F3F4F6] text-secondary flex items-center justify-center hover:text-primary transition-colors relative"
              >
                <Bell size={18} strokeWidth={1.5} className="w-[16px] h-[16px] md:w-[18px] md:h-[18px]" />
                {notifications.length > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-[#EF4444] rounded-full mt-[-1px] md:mt-[-2px] mr-[-1px] md:mr-[-2px] border-2 border-white"></span>}
              </button>
              
              {/* Notifications Dropdown */}
              {activeDropdown === 'notifications' && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-[320px] bg-white rounded-[12px] shadow-lg z-[1000] border border-divider flex flex-col max-h-[400px]">
                  <div className="px-4 py-3 border-b border-divider flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <span className="text-[14px] font-semibold text-[#111827]">Notifications</span>
                       {notifications.length > 0 && <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold">{notifications.length} unread</span>}
                    </div>
                    {notifications.length > 0 && <span className="text-[12px] text-[#9CA3AF] hover:text-primary cursor-pointer transition-colors" onClick={() => setNotifications([])}>Clear all</span>}
                  </div>
                  
                  <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                       <div className="p-6 flex flex-col items-center justify-center text-center">
                         <CheckCircle size={32} color="#22C55E" strokeWidth={1.5} className="mb-4" />
                         <p className="text-[12px] text-[#6B7280]">All good! No budget alerts.</p>
                       </div>
                    ) : (
                       <div className="flex flex-col">
                         {notifications.map((n, i) => {
                           let Icon = AlertTriangle;
                           let bgClass = '';
                           let iconColor = '';
                           if (n.type === 'WARNING') { bgClass = 'bg-[#FEF3C7]'; iconColor = '#F59E0B'; }
                           else if (n.type === 'HIGH') { bgClass = 'bg-[#FFF3E8]'; iconColor = '#F97316'; }
                           else if (n.type === 'OVER') { Icon = XCircle; bgClass = 'bg-[#FEF2F2]'; iconColor = '#EF4444'; }
                           else if (n.type === 'SAFE_WARNING') { Icon = TrendingUp; bgClass = 'bg-[#EFF6FF]'; iconColor = '#3B82F6'; }
                           
                           return (
                             <div key={i} className="px-4 py-3 hover:bg-[#F9FAFB] border-b border-divider last:border-b-0 flex gap-3 items-start transition-colors">
                               <div className={`w-8 h-8 rounded-[8px] ${bgClass} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                 <Icon size={16} color={iconColor} strokeWidth={1.5} />
                               </div>
                               <div className="flex-1 min-w-0 pt-0.5 flex flex-col gap-1">
                                 <p className="text-[13px] font-semibold text-[#111827] leading-tight">{n.title}</p>
                                 <p className="text-[12px] text-[#6B7280] leading-tight">{n.sub}</p>
                               </div>
                             </div>
                           )
                         })}
                       </div>
                    )}
                  </div>
                  
                  <div className="px-4 py-2 border-t border-divider bg-[#F9FAFB] text-center rounded-b-[12px]">
                     <span className="text-[10px] text-[#9CA3AF]">Alerts update in real time</span>
                  </div>
                </div>
              )}
            </div>

            {/* Avatar Dropdown */}
            <div className="relative">
              <div 
                onClick={() => setActiveDropdown(activeDropdown === 'profile' ? null : 'profile')} 
                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-accent border border-white flex items-center justify-center text-white font-bold cursor-pointer shadow-sm hover:opacity-90 transition-opacity text-[12px] md:text-base"
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>

              {activeDropdown === 'profile' && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-[220px] bg-white rounded-[12px] shadow-lg z-[1000] border border-divider flex flex-col">
                  {/* User Info Section */}
                  <div className="p-4 bg-[#F9FAFB] rounded-t-[12px] border-b border-divider flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold flex-shrink-0 text-[16px]">
                       {user?.name?.charAt(0).toUpperCase() || 'U'}
                     </div>
                     <div className="flex flex-col min-w-0">
                       <span className="text-[14px] font-semibold text-[#111827] truncate">{user?.name || 'User'}</span>
                       <span className="text-[12px] text-[#9CA3AF] truncate" title={user?.email || ''}>
                         {user?.email && user.email.length > 24 ? user.email.substring(0, 21) + '...' : (user?.email || 'user@example.com')}
                       </span>
                     </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="py-2 flex flex-col">
                    <div onClick={handleLogout} className="px-4 py-2.5 hover:bg-[#F9FAFB] cursor-pointer flex items-center gap-3 group">
                      <LogOut size={16} className="text-[#EF4444]" strokeWidth={1.5} />
                      <span className="text-[13px] text-[#EF4444]">Log out</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1">
          <Outlet context={{ budget, expenses, totalSpent, addExpense, setShowAddExpense }} />
        </div>
      </main>

      {/* Quick Add Bar (Mobile) */}
      <QuickAddBar onSubmit={handleAddExpense} lastCategory={lastCategory} />

      {/* Think Twice FAB */}
      <div className="fixed bottom-[70px] md:bottom-8 right-4 md:right-6 z-[40] md:z-30">
        <button
          onClick={() => setShowThinkTwice(true)}
          onMouseEnter={() => setFabHover(true)}
          onMouseLeave={() => setFabHover(false)}
          className="relative h-12 md:h-14 bg-accent text-white shadow-lg flex items-center justify-center text-2xl hover:scale-105 hover:shadow-card-hover transition-all duration-300 outline-none"
          style={{
            borderRadius: fabHover ? '28px' : '50%',
            width: fabHover ? 'auto' : (window.innerWidth <= 768 ? '48px' : '56px'),
            paddingLeft: fabHover ? '20px' : '0',
            paddingRight: fabHover ? '20px' : '0',
            minWidth: window.innerWidth <= 768 ? '48px' : '56px',
          }}
          title="Think Twice"
        >
          {/* Soft orange pulse ring */}
          <div className="absolute inset-0 rounded-full animate-pulse-glow pointer-events-none" style={{ borderRadius: fabHover ? '28px' : '50%' }}></div>
          <Brain size={22} color="white" strokeWidth={1.5} />
          {fabHover && <span className="ml-2 text-sm font-semibold whitespace-nowrap">Think Twice</span>}
        </button>
      </div>

      {/* Modals */}
      <AddExpenseModal isOpen={showAddExpense} onClose={() => setShowAddExpense(false)} onSubmit={handleAddExpense} lastCategory={lastCategory} />
      <ThinkTwiceModal isOpen={showThinkTwice} onClose={() => setShowThinkTwice(false)} onSkip={handleThinkTwiceSkip} onBuyAnyway={handleThinkTwiceBuy} />
      <OnboardingModal isOpen={showOnboarding} onComplete={handleOnboardingComplete} />
    </div>
  );
}

function QuickAddBar({ onSubmit, lastCategory }) {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState(lastCategory);
  const { error: showError } = useToast();

  useEffect(() => { setCat(lastCategory); }, [lastCategory]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!desc || desc.length < 2) return showError('Description needs at least 2 characters.');
    if (!amount || parseFloat(amount) <= 0) return showError('Enter a valid amount.');
    onSubmit({ description: desc, amount: parseFloat(amount), category: cat, date: new Date().toISOString().split('T')[0] });
    setDesc('');
    setAmount('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed bottom-0 left-0 right-0 md:left-64 bg-surface border-t border-divider px-4 py-3 flex items-center gap-3 z-30 mobile-nav-hidden"
      style={{ display: 'none' }}
    >
      <input
        type="text"
        value={desc}
        onChange={e => setDesc(e.target.value)}
        className="flex-1 text-sm"
        placeholder="Quick add..."
      />
      <input
        type="number"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        className="w-24 text-sm font-num"
        placeholder="₹"
      />
      <select
        value={cat}
        onChange={e => setCat(e.target.value)}
        className="text-sm"
      >
        <option value="Food">Food</option>
        <option value="Transport">Transport</option>
        <option value="Study">Study</option>
        <option value="Entertainment">Entertainment</option>
        <option value="Health">Health</option>
        <option value="Other">Other</option>
      </select>
      <button type="submit" className="bg-accent text-white px-4 py-2 rounded-[10px] text-sm font-semibold hover:bg-[#EA6C0A] transition-colors">
        Add
      </button>
    </form>
  );
}
