import React, { createContext, useContext, useState, useRef } from 'react';
import { Toast, ToastType } from '../components/ui/Toast';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastOptions {
  duration?: number;
  action?: ToastAction;
  persistent?: boolean;
}

interface ToastContextType {
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info', options?: ToastOptions) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);

interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  action?: ToastAction;
  persistent?: boolean;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const counterRef = useRef(0);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    showToast(message, type);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info', options: ToastOptions = {}) => {
    // Increment counter immediately to ensure uniqueness
    counterRef.current += 1;

    // Create a unique ID using timestamp and current counter value
    const timestamp = Date.now();
    const id = `${timestamp}-${counterRef.current}`;

    const toastData: ToastData = {
      id,
      type: type as ToastType,
      message,
      action: options.action,
      persistent: options.persistent || false,
    };

    setToasts(prev => [...prev, toastData]);

    // Auto-remove toast after duration (unless persistent)
    if (!options.persistent) {
      const duration = options.duration || (type === 'error' ? 7000 : 5000);
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, showToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-4">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
            action={toast.action}
            persistent={toast.persistent}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === null) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};