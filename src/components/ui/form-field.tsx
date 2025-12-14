'use client';

import React from 'react';

export interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  error,
  children,
  required = false,
}) => {
  return (
    <div className="space-y-1">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-[#A0AEC0]"
      >
        {label}
        {required && <span className="text-[#E53E3E] ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-[#E53E3E]">{error}</p>
      )}
    </div>
  );
};

export default FormField;
