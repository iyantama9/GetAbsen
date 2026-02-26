import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const modalMarkup = (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-content w-full sm:max-w-lg relative z-10 flex flex-col max-h-[90vh]">
        <div className="modal-header">
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all cursor-pointer"
            style={{ color: 'var(--color-text-muted)', boxShadow: 'var(--shadow-clay-sm)', background: 'var(--color-surface)' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-clay-pressed)'; e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.background = 'var(--color-surface-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-clay-sm)'; e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'var(--color-surface)' }}
          >
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalMarkup, document.body);
}
