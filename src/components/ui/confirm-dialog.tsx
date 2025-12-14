'use client';

import React from 'react';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Modal } from './modal';
import { Button } from './button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

const variantConfig = {
  danger: {
    icon: AlertCircle,
    iconColor: 'text-[#E53E3E]',
    confirmButtonClass: 'bg-[#E53E3E] hover:bg-[#C53030]',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-[#DD6B20]',
    confirmButtonClass: 'bg-[#DD6B20] hover:bg-[#C05621]',
  },
  info: {
    icon: Info,
    iconColor: 'text-[#3182CE]',
    confirmButtonClass: 'bg-[#3182CE] hover:bg-[#2B6CB0]',
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-md font-semibold text-white transition-all duration-200 disabled:opacity-50 ${config.confirmButtonClass}`}
          >
            {loading ? 'Loading...' : confirmText}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          <Icon className="h-6 w-6" />
        </div>
        <p className="text-[#A0AEC0]">{message}</p>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
