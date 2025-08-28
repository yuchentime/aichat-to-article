import { ToastManager } from './ToastManager';
import { ToastOptions, ToastType } from './types';

// Improved showToast function with backward compatibility
export const showToast = (type: ToastType, message: string, duration?: number): void => {
  const toastManager = ToastManager.getInstance();
  toastManager.show({ type, message, duration });
};

// Enhanced version with full options
export const showAdvancedToast = (options: ToastOptions): void => {
  const toastManager = ToastManager.getInstance();
  toastManager.show(options);
};

// Initialize cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    ToastManager.getInstance().destroy();
  });
}

// Export types for external use
export type { ToastOptions, ToastType };
export { ToastManager };