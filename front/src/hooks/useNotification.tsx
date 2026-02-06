"use client";

import { useState, useCallback } from 'react';
import Toast, { ToastType } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

interface ToastState {
  message: string;
  type: ToastType;
  id: number;
}

interface ConfirmState {
  title: string;
  message: string;
  type: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
}

export function useNotification() {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { message, type, id }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showSuccess = useCallback((message: string) => {
    showToast(message, 'success');
  }, [showToast]);

  const showError = useCallback((message: string) => {
    showToast(message, 'error');
  }, [showToast]);

  const showWarning = useCallback((message: string) => {
    showToast(message, 'warning');
  }, [showToast]);

  const showInfo = useCallback((message: string) => {
    showToast(message, 'info');
  }, [showToast]);

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      type?: 'danger' | 'warning' | 'info';
      confirmText?: string;
      cancelText?: string;
    }
  ) => {
    return new Promise<boolean>((resolve) => {
      setConfirm({
        title,
        message,
        type: options?.type || 'warning',
        confirmText: options?.confirmText,
        cancelText: options?.cancelText,
        onConfirm: () => {
          onConfirm();
          setConfirm(null);
          resolve(true);
        },
      });
    });
  }, []);

  const hideConfirm = useCallback(() => {
    setConfirm(null);
  }, []);

  const ToastContainer = useCallback(() => (
    <>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          type={confirm.type}
          confirmText={confirm.confirmText}
          cancelText={confirm.cancelText}
          onConfirm={confirm.onConfirm}
          onCancel={hideConfirm}
        />
      )}
    </>
  ), [toasts, confirm, removeToast, hideConfirm]);

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    ToastContainer,
  };
}
