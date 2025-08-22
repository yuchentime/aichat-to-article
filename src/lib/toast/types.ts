export interface ToastOptions {
  type: 'info' | 'error' | 'warn' | 'success';
  message: string;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export type ToastType = ToastOptions['type'];