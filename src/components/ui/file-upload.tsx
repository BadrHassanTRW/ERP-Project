'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import type { FileUploadConfig } from '@/types';

export interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  config: FileUploadConfig;
  currentPreview?: string | null;
  className?: string;
  disabled?: boolean;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export const validateFile = (file: File, config: FileUploadConfig): FileValidationResult => {
  // Check file type
  if (!config.allowedTypes.includes(file.type)) {
    const allowedExtensions = config.allowedTypes
      .map((type) => type.split('/')[1]?.toUpperCase())
      .join(', ');
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedExtensions}`,
    };
  }

  // Check file size
  if (file.size > config.maxSize) {
    const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  return { valid: true };
};

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  config,
  currentPreview,
  className = '',
  disabled = false,
}) => {
  const [preview, setPreview] = useState<string | null>(currentPreview ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | null) => {
      setError(null);

      if (!file) {
        setPreview(null);
        onFileSelect(null);
        return;
      }

      const validation = validateFile(file, config);
      if (!validation.valid) {
        setError(validation.error ?? 'Invalid file');
        return;
      }

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }

      onFileSelect(file);
    },
    [config, onFileSelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0] ?? null;
    handleFile(file);
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setError(null);
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const formatAllowedTypes = () => {
    return config.allowedTypes
      .map((type) => type.split('/')[1]?.toUpperCase())
      .join(', ');
  };

  const formatMaxSize = () => {
    return `${(config.maxSize / (1024 * 1024)).toFixed(0)}MB`;
  };

  return (
    <div className={className}>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6
          flex flex-col items-center justify-center
          transition-all duration-200 cursor-pointer
          ${isDragging ? 'border-[#4A90E2] bg-[#4A90E2]/10' : 'border-[#4A5568]'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#6772E5]'}
          ${error ? 'border-[#E53E3E]' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          onChange={handleInputChange}
          accept={config.allowedTypes.join(',')}
          disabled={disabled}
          className="hidden"
        />

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="max-h-32 max-w-full rounded-md object-contain"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="
                absolute -top-2 -right-2
                bg-[#E53E3E] text-white rounded-full p-1
                hover:bg-[#C53030] transition-colors
              "
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="mb-3 p-3 bg-[#3B4B63] rounded-full">
              {error ? (
                <AlertCircle className="h-6 w-6 text-[#E53E3E]" />
              ) : (
                <Upload className="h-6 w-6 text-[#A0AEC0]" />
              )}
            </div>
            <p className="text-sm text-[#A0AEC0] text-center">
              <span className="text-[#4A90E2] font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-[#718096] mt-1">
              {formatAllowedTypes()} (max {formatMaxSize()})
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-[#E53E3E] flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
};

export default FileUpload;
