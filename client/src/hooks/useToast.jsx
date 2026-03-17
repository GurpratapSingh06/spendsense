import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000, action = null) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type, action, exiting: false }]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  const success = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg) => addToast(msg, 'error'), [addToast]);
  const warning = useCallback((msg) => addToast(msg, 'warning'), [addToast]);
  const info = useCallback((msg) => addToast(msg, 'info'), [addToast]);
  const undoToast = useCallback((msg, onUndo, duration = 5000) => {
    return addToast(msg, 'undo', duration, onUndo);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info, undoToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, removeToast }) {
  const typeColors = {
    success: 'border-l-success',
    error: 'border-l-danger',
    warning: 'border-l-warning',
    info: 'border-l-info',
    undo: 'border-l-accent',
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`${toast.exiting ? 'toast-exit' : 'toast-enter'} ${typeColors[toast.type]} bg-surface border-l-4 border-y border-r border-divider rounded-[12px] px-4 py-3 shadow-lg flex items-center gap-3`}
        >
          <span className="text-sm font-semibold text-primary flex-1">{toast.message}</span>
          {toast.action && (
            <button
              onClick={() => { toast.action(); removeToast(toast.id); }}
              className="text-accent font-bold text-sm hover:underline whitespace-nowrap"
            >
              Undo
            </button>
          )}
          <button
            onClick={() => removeToast(toast.id)}
            className="text-secondary hover:text-primary text-lg leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
