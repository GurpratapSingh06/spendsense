import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import Button from '../components/ui/Button';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { error: showError } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return showError('Please fill in all fields.');
    if (password.length < 6) return showError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      showError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-primary mb-2">
            Spend<span className="text-accent">Sense</span>
          </h1>
          <p className="text-secondary text-sm">Start your smart spending journey</p>
        </div>
        <div className="card !p-8">
          <h2 className="text-xl font-display font-semibold text-primary mb-6">Create account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label block mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full text-sm"
                placeholder="Arjun Sharma"
              />
            </div>
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
                placeholder="Min 6 characters"
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
          <p className="text-center text-sm text-secondary mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
