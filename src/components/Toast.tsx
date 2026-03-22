import { useEffect, useState, useCallback } from 'react';
import { setToastDispatcher } from '../lib/toast';

interface Toast {
  id: number;
  message: string;
  leaving: boolean;
}

let toastId = 0;

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, leaving: false }]);
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)),
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 250);
    }, 2000);
  }, []);

  useEffect(() => {
    setToastDispatcher(addToast);
    return () => { setToastDispatcher(null); };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="px-5 py-2.5 rounded-lg text-sm font-medium pointer-events-auto"
          style={{
            background: 'linear-gradient(135deg, #1c1b25 0%, #2a2836 100%)',
            border: '1px solid var(--accent-border)',
            color: 'var(--accent-bright)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 8px rgba(201,168,76,0.15)',
            fontFamily: 'var(--heading)',
            letterSpacing: '0.3px',
            animation: toast.leaving ? 'toastOut 0.25s ease-in forwards' : 'toastIn 0.25s ease-out',
            whiteSpace: 'nowrap',
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
