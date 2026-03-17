import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { getCurrentMonthYear } from '../utils/dateHelpers';

export function useExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const { month, year } = getCurrentMonthYear();

  const fetchExpenses = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const params = { month, year, ...filters };
      const { data } = await api.get('/api/expenses', { params, withCredentials: true });
      setExpenses(data);
    } catch (err) {
      console.error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const addExpense = async (expense) => {
    const { data } = await api.post('/api/expenses', expense, { withCredentials: true });
    setExpenses(prev => [data, ...prev]);
    return data;
  };

  const updateExpense = async (id, updates) => {
    const { data } = await api.put(`/api/expenses/${id}`, updates, { withCredentials: true });
    setExpenses(prev => prev.map(e => e._id === id ? data : e));
    return data;
  };

  const deleteExpense = async (id) => {
    const { data } = await api.delete(`/api/expenses/${id}`, { withCredentials: true });
    setExpenses(prev => prev.filter(e => e._id !== id));
    return data.expense;
  };

  const bulkDelete = async (ids) => {
    await api.delete('/api/expenses/bulk', { data: { ids }, withCredentials: true });
    setExpenses(prev => prev.filter(e => !ids.includes(e._id)));
  };

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const todaySpend = expenses
    .filter(e => new Date(e.date).toDateString() === new Date().toDateString())
    .reduce((s, e) => s + e.amount, 0);

  return {
    expenses, loading, fetchExpenses,
    addExpense, updateExpense, deleteExpense, bulkDelete,
    totalSpent, categoryTotals, todaySpend
  };
}
