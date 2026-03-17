const fs = require('fs');

// 1. Update expenses.js
const expensesPath = 'd:\\\\Datathon\\\\server\\\\routes\\\\expenses.js';
let expCode = fs.readFileSync(expensesPath, 'utf8');
expCode = expCode.replace(
  'if (month && year) {',
  \`if (month && year && month !== 'all') {\`
);
fs.writeFileSync(expensesPath, expCode);

// 2. Update Layout.jsx
const layoutPath = 'd:\\\\Datathon\\\\client\\\\src\\\\pages\\\\Layout.jsx';
let layoutCode = fs.readFileSync(layoutPath, 'utf8');

// Add imports
layoutCode = layoutCode.replace(
  \`import { LayoutDashboard, Receipt, Wallet, Target, BarChart2, Search, Bell, Brain, LogOut } from 'lucide-react';\`,
  \`import { LayoutDashboard, Receipt, Wallet, Target, BarChart2, Search, Bell, Brain, LogOut, SearchX, AlertTriangle, XCircle, TrendingUp, CheckCircle, User, Settings } from 'lucide-react';\\nimport { CATEGORIES, CATEGORY_MAP } from '../constants/categories';\\nimport { formatDateShort, formatDate } from '../utils/dateHelpers';\`
);

// Add state & effects
const newHooks = \`
  const [activeDropdown, setActiveDropdown] = useState(null);
  const headerRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ expenses: [], goals: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.length >= 2 && activeDropdown === 'search') {
      const fetchSearch = async () => {
        setIsSearching(true);
        try {
          const [expRes, goalsRes] = await Promise.all([
            axios.get(\`/api/expenses?search=\${encodeURIComponent(debouncedQuery)}&month=all\`, { withCredentials: true }),
            axios.get('/api/goals', { withCredentials: true })
          ]);
          
          let filteredGoals = [];
          if (goalsRes.data && Array.isArray(goalsRes.data)) {
             filteredGoals = goalsRes.data.filter(g => g.name.toLowerCase().includes(debouncedQuery.toLowerCase()));
          }

          setSearchResults({ expenses: expRes.data || [], goals: filteredGoals });
        } catch (err) {
           console.error(err);
        } finally {
          setIsSearching(false);
        }
      };
      fetchSearch();
    } else {
      setSearchResults({ expenses: [], goals: [] });
    }
  }, [debouncedQuery, activeDropdown]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setActiveDropdown(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

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
           alerts.push({ type: 'OVER', title: \\\`\\\${cat} limit exceeded!\\\`, sub: \\\`₹\\\${spent.toLocaleString('en-IN')} spent — ₹\\\${(spent - limit).toLocaleString('en-IN')} over limit\\\` });
         } else if (pct >= 85) {
           alerts.push({ type: 'HIGH', title: \\\`\\\${cat} almost maxed\\\`, sub: \\\`₹\\\${spent.toLocaleString('en-IN')} spent of ₹\\\${limit.toLocaleString('en-IN')} limit\\\` });
         } else if (pct >= 70) {
           alerts.push({ type: 'WARNING', title: \\\`\\\${cat} budget at \\\${Math.round(pct)}%\\\`, sub: \\\`₹\\\${spent.toLocaleString('en-IN')} spent of ₹\\\${limit.toLocaleString('en-IN')} limit\\\` });
         }
      });
    }

    if (budget && budget.totalAllowance > 0) {
      const pct = (totalSpent / budget.totalAllowance) * 100;
      if (pct >= 100) {
         alerts.push({ type: 'OVER', title: \`Total budget exceeded!\`, sub: \\\`₹\\\${totalSpent.toLocaleString('en-IN')} spent of ₹\\\${budget.totalAllowance.toLocaleString('en-IN')} limit\\\` });
      } else if (pct >= 85) {
         alerts.push({ type: 'HIGH', title: \`Total budget almost maxed\`, sub: \\\`₹\\\${totalSpent.toLocaleString('en-IN')} spent of ₹\\\${budget.totalAllowance.toLocaleString('en-IN')} limit\\\` });
      } else if (pct >= 70) {
         alerts.push({ type: 'WARNING', title: \`Total budget at \\\${Math.round(pct)}%\`, sub: \\\`₹\\\${totalSpent.toLocaleString('en-IN')} spent of ₹\\\${budget.totalAllowance.toLocaleString('en-IN')} limit\\\` });
      }
      
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysLeft = daysInMonth - now.getDate() + 1;
      const totalFixed = (budget.fixedCosts || []).reduce((s, c) => s + c.amount, 0);
      const remaining = budget.totalAllowance - totalFixed - totalSpent;
      const safeToSpend = Math.max(0, Math.round(remaining / (daysLeft || 1)));
      
      const uniqueDays = new Set(expenses.map(e => new Date(e.date).toDateString())).size;
      const dailyAvg = uniqueDays > 0 ? Math.round(totalSpent / uniqueDays) : 0;
      
      if (dailyAvg > safeToSpend && safeToSpend > 0) {
         alerts.push({ type: 'SAFE_WARNING', title: \`Daily average above safe limit\`, sub: \\\`Spending ₹\\\${dailyAvg.toLocaleString('en-IN')}/day vs ₹\\\${safeToSpend.toLocaleString('en-IN')} safe limit\\\` });
      }
    }
    setNotifications(alerts);
  }, [budget, expenses, totalSpent]);

  useEffect(() => {
    if (user && !user.onboardingDone) {
\`;

layoutCode = layoutCode.replace(
  \`useEffect(() => {
    if (user && !user.onboardingDone) {\`,
  newHooks
);

// We need to add useRef import
layoutCode = layoutCode.replace(
  \`import { useState, useEffect } from 'react';\`,
  \`import { useState, useEffect, useRef } from 'react';\`
);

// Construct new header
const newHeader = \`
        <header ref={headerRef} className="relative flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 z-40">
          <div>
            <h1 className="text-[28px] font-extrabold text-primary mb-1">
              Welcome back, {user?.name ? user.name.split(' ')[0] : 'User'}!
            </h1>
            <p className="text-[14px] text-secondary">
              Here is what's happening with your money today.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search Dropdown */}
            <div className="relative">
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
                className="!bg-[#F3F4F6] !border-none !rounded-full !py-2 !pl-4 !pr-10 text-sm w-48 transition-all focus:ring-0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none"><Search size={16} strokeWidth={1.5} /></span>
              
              {/* Dropdown Container */}
              {activeDropdown === 'search' && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-[320px] bg-white rounded-[12px] shadow-lg overflow-y-auto max-h-[380px] z-[1000] border border-divider animate-fade-in">
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
                  ) : (searchResults.expenses.length === 0 && searchResults.goals.length === 0) ? (
                    <div className="p-6 flex flex-col items-center justify-center text-center">
                      <SearchX size={32} color="#D1D5DB" strokeWidth={1.5} className="mb-2" />
                      <p className="text-[12px] text-[#9CA3AF]">No results for "{searchQuery}"</p>
                    </div>
                  ) : (
                    <div className="py-2">
                      {searchResults.expenses.length > 0 && (
                         <>
                           <div className="text-[10px] uppercase text-[#9CA3AF] tracking-[0.1em] px-4 py-1.5 bg-[#F9FAFB]">── EXPENSES ({searchResults.expenses.length}) ──────────────────────</div>
                           {searchResults.expenses.map(exp => {
                             const CatIcon = CATEGORY_MAP[exp.category]?.icon || Receipt;
                             const color = CATEGORY_MAP[exp.category]?.color || '#374151';
                             return (
                               <div key={exp._id} onClick={() => { setActiveDropdown(null); navigate('/expenses'); }} className="px-4 py-2.5 hover:bg-[#F9FAFB] cursor-pointer flex items-center gap-2 border-b border-[#F3F4F6] last:border-b-0">
                                 <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                                    <CatIcon size={16} color={color} strokeWidth={1.5} />
                                 </div>
                                 <div className="flex-1 min-w-0 flex flex-col justify-center">
                                   <div className="flex justify-between items-center mb-0.5">
                                      <span className="text-sm font-semibold text-primary truncate pr-2">{exp.description}</span>
                                      <span className="text-sm font-mono-amounts text-primary flex-shrink-0">-₹{exp.amount.toLocaleString('en-IN')}</span>
                                   </div>
                                   <div className="text-[12px] text-secondary truncate">{exp.category} · {formatDateShort(exp.date)}</div>
                                 </div>
                               </div>
                             );
                           })}
                         </>
                      )}
                      
                      {searchResults.goals.length > 0 && (
                         <>
                           <div className="text-[10px] uppercase text-[#9CA3AF] tracking-[0.1em] px-4 py-1.5 bg-[#F9FAFB] mt-1">── GOALS ({searchResults.goals.length}) ─────────────────────────</div>
                           {searchResults.goals.map(goal => (
                               <div key={goal._id} onClick={() => { setActiveDropdown(null); navigate('/goals'); }} className="px-4 py-2.5 hover:bg-[#F9FAFB] cursor-pointer flex items-center gap-2 border-b border-[#F3F4F6] last:border-b-0">
                                 <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                                    <Target size={16} color="#F97316" strokeWidth={1.5} />
                                 </div>
                                 <div className="flex-1 min-w-0 flex flex-col justify-center">
                                   <div className="text-sm font-semibold text-primary truncate mb-0.5">{goal.name}</div>
                                   <div className="text-[12px] text-secondary truncate">₹{(goal.savedAmount || 0).toLocaleString('en-IN')} of ₹{goal.targetAmount.toLocaleString('en-IN')} saved</div>
                                 </div>
                               </div>
                           ))}
                         </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Notification Dropdown */}
            <div className="relative">
              <button onClick={() => setActiveDropdown(activeDropdown === 'notifications' ? null : 'notifications')} className="w-10 h-10 rounded-full bg-[#F3F4F6] text-secondary flex items-center justify-center hover:text-primary transition-colors relative">
                <Bell size={18} strokeWidth={1.5} />
                {notifications.length > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-[#EF4444] rounded-full"></span>}
              </button>
              
              {activeDropdown === 'notifications' && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-[320px] bg-white rounded-[12px] shadow-lg z-[1000] border border-divider animate-fade-in flex flex-col max-h-[400px]">
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
                         <CheckCircle size={32} color="#22C55E" strokeWidth={1.5} className="mb-2" />
                         <p className="text-[12px] text-[#6B7280]">All good! No budget alerts.</p>
                       </div>
                    ) : (
                       <div className="py-2">
                         {notifications.map((n, i) => {
                           let Icon = AlertTriangle;
                           let bgClass = '';
                           let iconColor = '';
                           if (n.type === 'WARNING') { bgClass = 'bg-[#FEF3C7]'; iconColor = '#F59E0B'; }
                           else if (n.type === 'HIGH') { bgClass = 'bg-[#FFF3E8]'; iconColor = '#F97316'; }
                           else if (n.type === 'OVER') { Icon = XCircle; bgClass = 'bg-[#FEF2F2]'; iconColor = '#EF4444'; }
                           else if (n.type === 'SAFE_WARNING') { Icon = TrendingUp; bgClass = 'bg-[#EFF6FF]'; iconColor = '#3B82F6'; }
                           
                           return (
                             <div key={i} className="px-4 py-3 hover:bg-[#F9FAFB] border-b border-[#F3F4F6] last:border-b-0 flex gap-3 items-start cursor-pointer transition-colors">
                               <div className={\`w-8 h-8 rounded-[8px] \${bgClass} flex items-center justify-center flex-shrink-0 mt-0.5\`}>
                                 <Icon size={16} color={iconColor} strokeWidth={1.5} />
                               </div>
                               <div className="flex-1 min-w-0">
                                 <p className="text-[13px] font-semibold text-[#111827] leading-tight mb-1">{n.title}</p>
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
              <div onClick={() => setActiveDropdown(activeDropdown === 'profile' ? null : 'profile')} className="w-10 h-10 rounded-full bg-accent border border-[#F3F4F6] flex items-center justify-center text-white font-bold cursor-pointer shadow-sm hover:opacity-90 transition-opacity">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>

              {activeDropdown === 'profile' && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-[220px] bg-white rounded-[12px] shadow-lg z-[1000] border border-divider animate-fade-in flex flex-col">
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
                  <div className="py-2 border-b border-[#F3F4F6]">
                    <div onClick={() => { setActiveDropdown(null); navigate('/'); }} className="px-4 py-2 hover:bg-[#F9FAFB] cursor-pointer flex items-center gap-3">
                      <User size={16} className="text-[#6B7280]" strokeWidth={1.5} />
                      <span className="text-[13px] text-[#374151]">Profile</span>
                    </div>
                    <div onClick={() => { setActiveDropdown(null); navigate('/'); }} className="px-4 py-2 hover:bg-[#F9FAFB] cursor-pointer flex items-center gap-3">
                      <Settings size={16} className="text-[#6B7280]" strokeWidth={1.5} />
                      <span className="text-[13px] text-[#374151]">Settings</span>
                    </div>
                  </div>

                  <div className="py-2">
                    <div onClick={handleLogout} className="px-4 py-2 hover:bg-[#F9FAFB] cursor-pointer flex items-center gap-3 group">
                      <LogOut size={16} className="text-[#EF4444]" strokeWidth={1.5} />
                      <span className="text-[13px] text-[#EF4444]">Log out</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
\`;

layoutCode = layoutCode.replace(
  /<header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">([\\s\\S]*?)<\\/header>/,
  newHeader
);

fs.writeFileSync(layoutPath, layoutCode);
console.log('Done updating layouts')
