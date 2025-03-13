import { toast } from 'react-toastify';
import type { ToastOptions } from 'react-toastify';

export function useToast() {
  const showToast = (message: string, options?: ToastOptions) => {
    toast(message, {
      position: 'bottom-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      ...options,
    });
  };

  return {
    success: (message: string, options?: ToastOptions) => showToast(message, { ...options, type: 'success' }),
    error: (message: string, options?: ToastOptions) => showToast(message, { ...options, type: 'error' }),
    info: (message: string, options?: ToastOptions) => showToast(message, { ...options, type: 'info' }),
    warning: (message: string, options?: ToastOptions) => showToast(message, { ...options, type: 'warning' }),
  };
}
