import React from 'react';
import { CheckCircleIcon, XCircleIcon } from './icons';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ message, type }) => {
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const Icon = type === 'success' ? CheckCircleIcon : XCircleIcon;

  return (
    <div className={`${bgColor} text-white font-bold rounded-lg shadow-lg flex items-center p-4`}>
      <Icon className="h-6 w-6 mr-3" />
      <span>{message}</span>
    </div>
  );
};

interface ToastContainerProps {
  toasts: { id: number; message: string; type: 'success' | 'error' }[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-3">
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} type={toast.type} />
      ))}
    </div>
  );
};
