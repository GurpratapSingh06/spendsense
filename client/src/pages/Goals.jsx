import { useState, useEffect } from 'react';
import api from '../utils/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ProgressBar from '../components/ui/ProgressBar';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate, getDaysLeftInMonth } from '../utils/dateHelpers';
import { Trophy, CheckCircle, Trash2, Target } from 'lucide-react';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', targetAmount: '', targetDate: '' });
  const [showAddSavings, setShowAddSavings] = useState(null);
  const [savingsAmount, setSavingsAmount] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [celebrating, setCelebrating] = useState(null);
  const { success, error: showError } = useToast();

  useEffect(() => { fetchGoals(); }, []);

  const fetchGoals = async () => {
    try {
      const { data } = await api.get('/api/goals', { withCredentials: true });
      setGoals(data);
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.targetAmount) return showError('Name and target amount required.');
    try {
      const { data } = await api.post('/api/goals', {
        name: addForm.name,
        targetAmount: parseFloat(addForm.targetAmount),
        targetDate: addForm.targetDate || null,
      }, { withCredentials: true });
      setGoals(prev => [data, ...prev]);
      setShowAdd(false);
      setAddForm({ name: '', targetAmount: '', targetDate: '' });
      success('Goal created!');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to create goal.');
    }
  };

  const handleAddSavings = async () => {
    if (!savingsAmount || parseFloat(savingsAmount) <= 0) return;
    try {
      const goal = showAddSavings;
      const newSaved = goal.savedAmount + parseFloat(savingsAmount);
      const { data } = await api.put(`/api/goals/${goal._id}`, {
        savedAmount: newSaved,
      }, { withCredentials: true });
      setGoals(prev => prev.map(g => g._id === goal._id ? data : g));
      setShowAddSavings(null);
      setSavingsAmount('');

      if (newSaved >= goal.targetAmount && !goal.completedAt) {
        setCelebrating(goal._id);
        try {
          const confetti = (await import('canvas-confetti')).default;
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        } catch { /* silent */ }
        success('Goal completed! Congratulations!');
        setTimeout(() => setCelebrating(null), 3000);
      } else {
        success(`₹${parseFloat(savingsAmount).toLocaleString('en-IN')} added to ${goal.name}!`);
      }
    } catch (err) {
      showError('Failed to add savings.');
    }
  };

  const handleDelete = async (goal) => {
    try {
      await api.delete(`/api/goals/${goal._id}`, { withCredentials: true });
      setGoals(prev => prev.filter(g => g._id !== goal._id));
      setConfirmDelete(null);
      success('Goal deleted.');
    } catch { showError('Failed to delete.'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">Savings Goals</h1>
          <p className="text-secondary text-sm mt-1">Track your savings progress</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>+ New Goal</Button>
      </div>

      {goals.length === 0 && !loading ? (
        <Card className="text-center py-12">
          <p className="mb-3"><Target size={48} color="#D1D5DB" strokeWidth={1.5} /></p>
          <p className="text-primary font-semibold">No savings goals yet</p>
          <p className="text-xs text-secondary mt-1 mb-4">Set a goal and start saving!</p>
          <Button onClick={() => setShowAdd(true)}>Create First Goal</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {goals.map(goal => {
            const pct = Math.round((goal.savedAmount / goal.targetAmount) * 100);
            const completed = goal.savedAmount >= goal.targetAmount;
            const daysLeft = goal.targetDate
              ? Math.max(0, Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24)))
              : null;

            return (
              <Card
                key={goal._id}
                className={`${celebrating === goal._id ? 'animate-shake border-accent/50' : ''} ${completed ? 'border-accent/30 !bg-accent/5' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-display font-semibold text-primary">
                      {completed && <CheckCircle size={16} strokeWidth={1.5} className="inline mr-1 text-accent" />}{goal.name}
                    </h3>
                    {daysLeft !== null && !completed && (
                      <p className="text-xs text-secondary font-mono mt-0.5">{daysLeft} days until target</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!completed && (
                      <Button size="sm" variant="ghost" onClick={() => { setShowAddSavings(goal); setSavingsAmount(''); }}>
                        + Add
                      </Button>
                    )}
                    <button onClick={() => setConfirmDelete(goal)} className="text-secondary hover:text-danger text-sm transition-colors"><Trash2 size={14} strokeWidth={1.5} /></button>
                  </div>
                </div>

                <ProgressBar value={goal.savedAmount} max={goal.targetAmount} color={completed ? '#22C55E' : '#3B82F6'} height={10} />

                <div className="flex justify-between mt-2">
                  <span className="font-num text-sm text-primary">
                    <AnimatedNumber value={goal.savedAmount} className="text-sm" /> of {formatCurrency(goal.targetAmount)}
                  </span>
                  <span className={`font-num text-sm font-bold ${completed ? 'text-accent' : pct >= 75 ? 'text-info' : 'text-secondary'}`}>
                    {pct}%
                  </span>
                </div>
                {!completed && (
                  <p className="text-xs text-secondary font-num mt-1">
                    ₹{(goal.targetAmount - goal.savedAmount).toLocaleString('en-IN')} remaining
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Create Savings Goal" size="sm">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="form-label block mb-1">Goal Name</label>
            <input
              type="text"
              value={addForm.name}
              onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
              className="w-full text-sm"
              placeholder="e.g. Laptop Fund"
            />
          </div>
          <div>
            <label className="form-label block mb-1">Target Amount (₹)</label>
            <input
              type="number"
              value={addForm.targetAmount}
              onChange={e => setAddForm(p => ({ ...p, targetAmount: e.target.value }))}
              className="w-full text-sm font-num"
              placeholder="45000"
            />
          </div>
          <div>
            <label className="form-label block mb-1">Target Date (optional)</label>
            <input
              type="date"
              value={addForm.targetDate}
              onChange={e => setAddForm(p => ({ ...p, targetDate: e.target.value }))}
              className="w-full text-sm"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit">Create Goal</Button>
          </div>
        </form>
      </Modal>

      {/* Add Savings Modal */}
      <Modal isOpen={!!showAddSavings} onClose={() => setShowAddSavings(null)} title={`Add to ${showAddSavings?.name || ''}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="form-label block mb-1">Amount (₹)</label>
            <input
              type="number"
              value={savingsAmount}
              onChange={e => setSavingsAmount(e.target.value)}
              className="w-full text-lg font-num"
              placeholder="0"
              min="1"
              onKeyDown={e => { if (e.key === 'Enter') handleAddSavings(); }}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowAddSavings(null)}>Cancel</Button>
            <Button onClick={handleAddSavings}>Add Savings</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete)}
        title="Delete Goal"
        message={confirmDelete ? `Delete '${confirmDelete.name}'? This cannot be undone.` : ''}
      />
    </div>
  );
}
