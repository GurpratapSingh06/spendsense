import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';
import { Sparkles } from 'lucide-react';

export default function AITip() {
  const [tip, setTip] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTip();
  }, []);

  const fetchTip = async () => {
    try {
      setLoading(true);
      const { data } = await api.post('/api/ai/daily-insight', {}, { withCredentials: true });
      setTip(data.tip);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate AI insight.');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    const isKeyError = error === 'GROQ_API_KEY not configured';
    return (
      <Card className="border-info/20">
        <p className="section-header mb-2 flex items-center gap-1.5"><Sparkles size={16} strokeWidth={1.5} className="text-accent" /> AI Daily Insight</p>
        <p className="text-sm text-secondary">
          {isKeyError ? 'Configure your Groq API key for daily insights.' : error}
        </p>
      </Card>
    );
  }

  return (
    <Card className="border-info/20 !bg-gradient-to-br from-info/5 to-transparent">
      <p className="section-header mb-2 flex items-center gap-1.5"><Sparkles size={16} strokeWidth={1.5} className="text-accent" /> AI Daily Insight</p>
      {loading ? (
        <div className="space-y-2">
          <Skeleton height={14} />
          <Skeleton height={14} width="80%" />
        </div>
      ) : (
        <p className="text-sm text-secondary leading-relaxed">{tip}</p>
      )}
    </Card>
  );
}
