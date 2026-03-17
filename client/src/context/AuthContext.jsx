import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('sb_token');
    if (savedToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      // Verify token is still valid
      api.get('/api/auth/me')
        .then(({ data }) => setUser(data.user))
        .catch(() => {
          localStorage.removeItem('sb_token');
          delete api.defaults.headers.common['Authorization'];
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password, rememberMe = false) => {
    const { data } = await api.post('/api/auth/login', { email, password, rememberMe });
    setUser(data.user);
    localStorage.setItem('sb_token', data.access_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/api/auth/register', { name, email, password });
    setUser(data.user);
    if (data.access_token) {
      localStorage.setItem('sb_token', data.access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
    }
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignore logout errors
    }
    setUser(null);
    localStorage.removeItem('sb_token');
    delete api.defaults.headers.common['Authorization'];
  };

  const loginWithToken = async (token, nameHint) => {
    try {
      localStorage.setItem('sb_token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Fetch full profile from backend
      const res = await api.get('/api/auth/me');
      setUser(res.data.user);
    } catch (err) {
      // If profile fetch fails, use name hint
      setUser({
        name: nameHint || 'User',
        email: ''
      });
    }
  };

  const completeOnboarding = async () => {
    await api.put('/api/auth/onboarding');
    setUser(prev => ({ ...prev, onboardingDone: true }));
  };

  const updateSettings = async (settings) => {
    const { data } = await api.put('/api/auth/settings', { settings });
    setUser(prev => ({ ...prev, settings: data.settings }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithToken, completeOnboarding, updateSettings }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
