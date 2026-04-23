'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-800',
      icon: <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      icon: <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
    },
  }[type];

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg transition-all duration-300 ${styles.bg} ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {styles.icon}
      <p className={`flex-1 text-sm font-medium leading-snug ${styles.text}`}>{message}</p>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className={`${styles.text} opacity-60 hover:opacity-100`}>
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Toast container + hook ────────────────────────────────────────────────────

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

let _toastQueue: ((item: Omit<ToastItem, 'id'>) => void) | null = null;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    _toastQueue = (item) => {
      setToasts((prev) => [...prev, { ...item, id: Date.now() }]);
    };
    return () => { _toastQueue = null; };
  }, []);

  const remove = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return { toasts, remove };
}

export function toast(message: string, type: ToastType = 'success') {
  if (_toastQueue) _toastQueue({ message, type });
}

export function ToastContainer() {
  const { toasts, remove } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => remove(t.id)} />
      ))}
    </div>
  );
}
