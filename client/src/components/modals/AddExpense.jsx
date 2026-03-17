import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { CATEGORIES } from '../../constants/categories';
import { getTodayStr, isFutureDate } from '../../utils/dateHelpers';

export default function AddExpenseModal({ isOpen, onClose, onSubmit, lastCategory = 'Food' }) {
  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: lastCategory,
    date: getTodayStr(),
    note: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm({ description: '', amount: '', category: lastCategory, date: getTodayStr(), note: '' });
      setErrors({});
    }
  }, [isOpen, lastCategory]);

  const validate = () => {
    const e = {};
    if (!form.description || form.description.trim().length < 2) e.description = 'Min 2 characters';
    if (form.description.length > 60) e.description = 'Max 60 characters';
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = 'Must be > 0';
    if (!form.category) e.category = 'Required';
    if (isFutureDate(form.date)) e.date = 'Cannot be future date';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...form,
      amount: parseFloat(form.amount),
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Expense">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="form-label block mb-1">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            onKeyDown={handleKeyDown}
            className={`w-full text-sm ${errors.description ? '!border-danger' : ''}`}
            placeholder="e.g. Mess lunch, Auto ride..."
            maxLength={60}
          />
          <div className="flex justify-between mt-1">
            {errors.description && <span className="text-xs text-danger">{errors.description}</span>}
            <span className="text-xs text-secondary font-num ml-auto">{form.description.length}/60</span>
          </div>
        </div>

        <div>
          <label className="form-label block mb-1">Amount (₹)</label>
          <input
            type="number"
            value={form.amount}
            onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
            onKeyDown={handleKeyDown}
            className={`w-full text-sm font-num ${errors.amount ? '!border-danger' : ''}`}
            placeholder="0"
            min="0"
            step="1"
          />
          {errors.amount && <span className="text-xs text-danger mt-1 block">{errors.amount}</span>}
        </div>

        <div>
          <label className="form-label block mb-1">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setForm(p => ({ ...p, category: cat.key }))}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] border text-xs font-semibold transition-all ${
                  form.category === cat.key
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-divider bg-surface-2 text-secondary hover:border-[#D1D5DB]'
                }`}
              >
                {(() => { const Icon = cat.icon; return <Icon size={16} strokeWidth={1.5} />; })()}
                <span>{cat.key}</span>
              </button>
            ))}
          </div>
          {errors.category && <span className="text-xs text-danger mt-1 block">{errors.category}</span>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label block mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              max={getTodayStr()}
              className={`w-full text-sm ${errors.date ? '!border-danger' : ''}`}
            />
            {errors.date && <span className="text-xs text-danger mt-1 block">{errors.date}</span>}
          </div>
          <div>
            <label className="form-label block mb-1">Note (optional)</label>
            <input
              type="text"
              value={form.note}
              onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              onKeyDown={handleKeyDown}
              className="w-full text-sm"
              placeholder="Optional note..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add Expense</Button>
        </div>
      </form>
    </Modal>
  );
}
