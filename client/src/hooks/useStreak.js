import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export function useStreak() {
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStreak = useCallback(async () => {
    try {
      const { data } = await api.get('/api/streak', { withCredentials: true });
      setStreak(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStreak(); }, [fetchStreak]);

  const incrementStreak = async () => {
    const { data } = await api.put('/api/streak/increment', {}, { withCredentials: true });
    setStreak(data);
    return data;
  };

  const resetStreak = async () => {
    const { data } = await api.put('/api/streak/reset', {}, { withCredentials: true });
    setStreak(data);
    return data;
  };

  return { streak, loading, fetchStreak, incrementStreak, resetStreak };
}
