import { useState } from 'react';
import api from '../../utils/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Brain } from 'lucide-react';

export default function ThinkTwiceModal({ isOpen, onClose, onSkip, onBuyAnyway }) {
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [showActions, setShowActions] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!item || !amount) return;
    setLoading(true);
    setResponse('');
    setDisplayText('');
    setShowActions(false);
    try {
      const { data } = await api.post('/api/ai/think-twice', {
        item, amount: parseFloat(amount)
      }, { withCredentials: true });
      setResponse(data.response);
      typewriterEffect(data.response);
    } catch (err) {
      setResponse('AI service is unavailable right now. Trust your gut.');
      setDisplayText('AI service is unavailable right now. Trust your gut.');
      setShowActions(true);
    } finally {
      setLoading(false);
    }
  };

  const typewriterEffect = (text) => {
    let i = 0;
    setDisplayText('');
    const interval = setInterval(() => {
      i++;
      setDisplayText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setShowActions(true);
      }
    }, 20);
  };

  const handleSkip = () => {
    onSkip?.();
    resetAndClose();
  };

  const handleBuy = () => {
    onBuyAnyway?.({ description: item, amount: parseFloat(amount) });
    resetAndClose();
  };

  const resetAndClose = () => {
    setItem('');
    setAmount('');
    setResponse('');
    setDisplayText('');
    setShowActions(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title={<div className="flex items-center gap-2"><Brain size={20} className="text-accent" strokeWidth={1.5} /> Think Twice</div>} size="md">
      {!response ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-secondary">What are you thinking of buying?</p>
          <input
            type="text"
            value={item}
            onChange={e => setItem(e.target.value)}
            className="w-full text-sm"
            placeholder="e.g. Zomato order, New earphones..."
          />
          <div>
            <label className="form-label block mb-1">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full text-sm font-num"
              placeholder="0"
              min="1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !item || !amount}>
            {loading ? 'Thinking...' : 'Get Reality Check'}
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="bg-surface-2 rounded-xl p-4 border border-divider">
            <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">{displayText}</p>
            {loading && <span className="inline-block w-2 h-4 bg-accent animate-pulse ml-1" />}
          </div>
          {showActions && (
            <div className="flex gap-3 animate-fade-in">
              <Button variant="primary" className="flex-1" onClick={handleSkip}>
                Skip it
              </Button>
              <Button variant="ghost" className="flex-1" onClick={handleBuy}>
                Buy anyway
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
