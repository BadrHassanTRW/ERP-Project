'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import type { AlertType } from '@/types';

export interface ToastProps {
  id: string;
  type: AlertType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const toastConfig: Record<AlertType, { icon: typeof CheckCircle; bgColor: string; iconColor: string }> = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-[#38A169]',
    iconColor: 'text-white',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-[#E53E3E]',
    iconColor: 'text-white',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-[#DD6B20]',
    iconColor: 'text-white',
  },
  info: {
    icon: Info,
    bgColor: 'bg-[#3182CE]',
    iconColor: 'text-white',
  },
};

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const config = toastConfig[type];
  const Icon = config.icon;

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  }, [id, onClose]);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(handleClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, handleClose]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white transition-all duration-300 ${config.bgColor} ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
      role="alert"
    >
      <Icon className={`h-5 w-5 flex-shrink-0 ${config.iconColor}`} />
      <p className="flex-1 text-sm">{message}</p>
      <button
        onClick={handleClose}
        className="flex-shrink-0 hover:opacity-80 transition-opacity"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// Toast Container for managing multiple toasts
export interface ToastItem {
  id: string;
  type: AlertType;
  message: string;
  duration?: number;
}

export interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={onRemove}
        />
      ))}
    </div>
  );
};

export default Toast;
