import { useEffect, useRef } from 'react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        const input = document.querySelector('.modal-content input, .modal-content textarea, .modal-content select');
        if (input) input.focus();
      }, 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-[480px]',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(17,24,39,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className={`modal-content bg-surface rounded-[20px] w-full ${sizes[size]} animate-slide-up shadow-2xl max-h-[85vh] overflow-y-auto`} style={{ padding: '32px' }}>
        {title && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[20px] font-display font-bold text-primary">{title}</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-secondary hover:text-primary hover:bg-[#F3F4F6] text-2xl leading-none transition-colors">×</button>
          </div>
        )}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}
