import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate, getTodayStr, toInputDate } from '../utils/dateHelpers';
import { CATEGORIES } from '../constants/categories';
import api from '../utils/api';
import { Copy, Trash2, Pencil, Receipt, ArrowUpDown } from 'lucide-react';

export default function Expenses() {
  const { addExpense } = useOutletContext();
  const { success, error: showError, undoToast } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selected, setSelected] = useState(new Set());
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmBulk, setConfirmBulk] = useState(false);

  const now = new Date();

  useEffect(() => { fetchExpenses(); }, [search, filterCat, sortBy, sortOrder]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        ...(filterCat && { category: filterCat }),
        ...(search && { search }),
        sortBy,
        sortOrder,
      };
      const { data } = await api.get('/api/expenses', { params, withCredentials: true });
      setExpenses(data);
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleDelete = async (expense) => {
    try {
      await api.delete(`/api/expenses/${expense._id}`, { withCredentials: true });
      setExpenses(prev => prev.filter(e => e._id !== expense._id));
      setConfirmDelete(null);
      undoToast(`Expense deleted.`, async () => {
        try {
          const { data } = await api.post('/api/expenses', {
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            date: expense.date,
            note: expense.note,
          }, { withCredentials: true });
          setExpenses(prev => [data, ...prev]);
        } catch { /* silent */ }
      });
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to delete.');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const ids = Array.from(selected);
      await api.delete('/api/expenses/bulk', { data: { ids }, withCredentials: true });
      setExpenses(prev => prev.filter(e => !selected.has(e._id)));
      setSelected(new Set());
      setConfirmBulk(false);
      success(`${ids.length} expenses deleted.`);
    } catch (err) {
      showError('Failed to delete selected expenses.');
    }
  };

  const handleEdit = (expense) => {
    setEditId(expense._id);
    setEditForm({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: toInputDate(expense.date),
      note: expense.note || '',
    });
  };

  const handleSaveEdit = async () => {
    try {
      const { data } = await api.put(`/api/expenses/${editId}`, editForm, { withCredentials: true });
      setExpenses(prev => prev.map(e => e._id === editId ? data : e));
      setEditId(null);
      success('Expense updated.');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update.');
    }
  };

  const handleDuplicate = async () => {
    if (expenses.length === 0) return;
    const last = expenses[0];
    try {
      const { data } = await api.post('/api/expenses', {
        description: last.description,
        amount: last.amount,
        category: last.category,
        date: getTodayStr(),
      }, { withCredentials: true });
      setExpenses(prev => [data, ...prev]);
      success('Expense duplicated!');
    } catch (err) {
      showError('Failed to duplicate.');
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === expenses.length) setSelected(new Set());
    else setSelected(new Set(expenses.map(e => e._id)));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">Expenses</h1>
          <p className="text-secondary text-sm mt-1">Manage all your expenses</p>
        </div>
        <div className="flex items-center gap-2">
          {expenses.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleDuplicate}>
              <Copy size={14} strokeWidth={1.5} className="inline mr-1" /> Duplicate Last
            </Button>
          )}
          {selected.size > 0 && (
            <Button variant="danger" size="sm" onClick={() => setConfirmBulk(true)}>
              <Trash2 size={14} strokeWidth={1.5} className="inline mr-1" /> Delete {selected.size}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="!p-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[180px] text-sm"
            placeholder="Search expenses..."
          />
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="text-sm"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c.key} value={c.key}>{c.key}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="text-sm"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="category">Sort by Category</option>
          </select>
          <button
            onClick={() => setSortOrder(p => p === 'asc' ? 'desc' : 'asc')}
            className="bg-[#F3F4F6] border border-divider rounded-[10px] px-3 py-2 text-sm text-primary hover:bg-[#E5E7EB] transition-colors"
          >
            <ArrowUpDown size={14} strokeWidth={1.5} />
          </button>
        </div>
      </Card>

      {/* Expense List */}
      <Card className="!p-0 overflow-hidden">
        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <p className="mb-3"><Receipt size={48} color="#D1D5DB" strokeWidth={1.5} /></p>
            <p className="text-primary font-semibold">No expenses found</p>
            <p className="text-xs text-secondary mt-1">Add your first expense →</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 px-4 py-2 border-b border-divider bg-[#F9FAFB]">
              <input type="checkbox" checked={selected.size === expenses.length} onChange={toggleAll} className="accent-accent" />
              <span className="section-header flex-1">Description</span>
              <span className="section-header w-24 text-right">Amount</span>
              <span className="section-header w-[140px] hidden md:block">Category</span>
              <span className="section-header w-[120px] hidden md:block text-right">Date</span>
              <span className="w-20" />
            </div>
            {expenses.map((exp, i) => (
              <div
                key={exp._id}
                className={`flex items-center gap-3 px-4 py-3 border-b border-divider/50 hover:bg-[#F9FAFB] transition-all animate-slide-in ${selected.has(exp._id) ? 'bg-accent/5' : ''}`}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <input type="checkbox" checked={selected.has(exp._id)} onChange={() => toggleSelect(exp._id)} className="accent-accent" />
                {editId === exp._id ? (
                  <>
                    <input
                      value={editForm.description}
                      onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                      className="flex-1 !border-accent/30 !rounded text-sm"
                    />
                    <input
                      type="number"
                      value={editForm.amount}
                      onChange={e => setEditForm(p => ({ ...p, amount: parseFloat(e.target.value) }))}
                      className="w-24 !border-accent/30 !rounded text-sm font-num text-right"
                    />
                    <select
                      value={editForm.category}
                      onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}
                      className="w-24 !border-accent/30 !rounded text-sm hidden md:block"
                    >
                      {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.key}</option>)}
                    </select>
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))}
                      max={getTodayStr()}
                      className="w-24 !border-accent/30 !rounded text-sm hidden md:block"
                    />
                    <div className="w-20 flex gap-1">
                      <button onClick={handleSaveEdit} className="text-accent text-xs hover:underline font-semibold">Save</button>
                      <button onClick={() => setEditId(null)} className="text-secondary text-xs hover:underline">Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0" onClick={() => handleEdit(exp)} role="button">
                      <p className="text-sm text-primary truncate cursor-pointer hover:text-accent transition-colors">{exp.description}</p>
                      {exp.note && <p className="text-xs text-secondary truncate">{exp.note}</p>}
                    </div>
                    <span className="font-mono-amounts text-sm text-accent w-24 text-right">-₹{exp.amount.toLocaleString('en-IN')}</span>
                    <span className="w-[140px] hidden md:block"><Badge category={exp.category} size="sm" /></span>
                    <span className="w-[120px] text-xs text-secondary font-num hidden md:block whitespace-nowrap text-right">{formatDate(exp.date)}</span>
                    <div className="w-20 flex justify-end gap-2">
                      <button onClick={() => handleEdit(exp)} className="text-secondary hover:text-primary text-xs transition-colors"><Pencil size={14} strokeWidth={1.5} /></button>
                      <button onClick={() => setConfirmDelete(exp)} className="text-secondary hover:text-danger text-xs transition-colors"><Trash2 size={14} strokeWidth={1.5} /></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete)}
        title="Delete Expense"
        message={confirmDelete ? `This will permanently delete '${confirmDelete.description} ₹${confirmDelete.amount}'. This cannot be undone.` : ''}
      />
      <ConfirmDialog
        isOpen={confirmBulk}
        onClose={() => setConfirmBulk(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected"
        message={`This will permanently delete ${selected.size} expenses. This cannot be undone.`}
      />
    </div>
  );
}
