import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import Button from '../components/ui/Button';
import api from '../utils/api';
import { supabase } from '../utils/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { error: showError } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return showError('Please fill in all fields.');
    setLoading(true);
    try {
      await login(email, password, rememberMe);
      navigate('/');
    } catch (err) {
      showError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) showError('Google login failed. Try again.');
    } catch (err) {
      showError('Google login failed. Try again.');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-primary mb-2">
            Spend<span className="text-accent">Sense</span>
          </h1>
          <p className="text-secondary text-sm">Student Finance Solution</p>
        </div>
        <div className="card !p-8">
          <h2 className="text-xl font-display font-semibold text-primary mb-6">Welcome to SpendSense!</h2>

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            style={{
              width: '100%',
              padding: '11px',
              background: '#FFFFFF',
              border: '1.5px solid #E5E7EB',
              borderRadius: '10px',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.15s ease',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              marginBottom: '16px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#D1D5DB';
              e.currentTarget.style.background = '#F9FAFB';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.background = '#FFFFFF';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" />
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z" />
              <path fill="#FBBC05" d="M4.5 10.48A4.8 4.8 0 0 1 4.5 7.52V5.45H1.83a8 8 0 0 0 0 7.1l2.67-2.07z" />
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.45L4.5 7.52a4.8 4.8 0 0 1 4.48-3.34z" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
            <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '500' }}>or sign in with email</span>
            <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full text-sm"
                placeholder="you@university.edu"
              />
            </div>
            <div>
              <label className="form-label block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full text-sm"
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="rounded border-divider bg-surface-2 accent-accent"
              />
              <label htmlFor="remember" className="text-sm text-secondary">Remember me for 30 days</label>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <p className="text-center text-sm text-secondary mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent hover:underline font-semibold">Sign up</Link>
          </p>
        </div>

      </div>
    </div>
  );
}
