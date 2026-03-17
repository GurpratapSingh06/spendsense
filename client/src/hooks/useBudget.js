import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { getCurrentMonthYear } from '../utils/dateHelpers';

export function useBudget() {
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);

  const { month, year } = getCurrentMonthYear();

  const fetchBudget = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/budget', { params: { month, year }, withCredentials: true });
      setBudget(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchBudget(); }, [fetchBudget]);

  const saveBudget = async (budgetData) => {
    const { data } = await api.post('/api/budget', { ...budgetData, month, year }, { withCredentials: true });
    setBudget(data);
    return data;
  };

  return { budget, loading, fetchBudget, saveBudget };
}
