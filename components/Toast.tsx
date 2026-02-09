
import React, { useEffect } from 'react';
import { ToastMessage } from '../types';

interface ToastProps {
  message: ToastMessage | null;
  onClear: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClear }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClear, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, onClear]);

  if (!message) return null;

  const bgStyles = {
    info: 'bg-indigo-600',
    success: 'bg-green-600',
    error: 'bg-red-600',
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-bounce">
      <div className={`${bgStyles[message.type]} text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 whitespace-nowrap`}>
        {message.type === 'success' && <i className="fas fa-star"></i>}
        {message.type === 'error' && <i className="fas fa-exclamation-circle"></i>}
        {message.type === 'info' && <i className="fas fa-info-circle"></i>}
        <span className="font-semibold text-sm">{message.text}</span>
      </div>
    </div>
  );
};

export default Toast;
