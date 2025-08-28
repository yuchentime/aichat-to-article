import { ToastOptions } from './types';

export class ToastManager {
  private static instance: ToastManager;
  private toastContainer: HTMLElement | null = null;
  private activeToasts = new Set<HTMLElement>();
  private readonly maxToasts = 5;

  private constructor() {
    this.createContainer();
  }

  static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  private createContainer(): void {
    if (this.toastContainer) return;

    this.toastContainer = document.createElement('div');
    this.toastContainer.id = 'aichat-toast-container';
    this.toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // Safely append to body with error handling
    try {
      document.body?.appendChild(this.toastContainer);
    } catch (error) {
      console.error('Failed to create toast container:', error);
    }
  }

  private createToastElement(options: ToastOptions): HTMLElement {
    const toast = document.createElement('div');
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    
    const typeColors = {
      info: '#3b82f6',
      success: '#10b981',
      warn: '#f59e0b',
      error: '#ef4444'
    };

    const typeIcons = {
      info: 'ℹ️',
      success: '✅',
      warn: '⚠️',
      error: '❌'
    };

    toast.style.cssText = `
      background: white;
      border-left: 4px solid ${typeColors[options.type]};
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      color: #374151;
      font-size: 14px;
      line-height: 1.4;
      margin-bottom: 8px;
      max-width: 350px;
      opacity: 0;
      padding: 12px 16px;
      pointer-events: auto;
      position: relative;
      transform: translateX(100%);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      word-wrap: break-word;
    `;

    // Sanitize message content to prevent XSS
    const sanitizedMessage = this.sanitizeText(options.message);
    toast.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 8px;">
        <span style="flex-shrink: 0; font-size: 16px;">${typeIcons[options.type]}</span>
        <span style="flex: 1;">${sanitizedMessage}</span>
      </div>
    `;

    return toast;
  }

  private sanitizeText(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private animateIn(toast: HTMLElement): void {
    // Force reflow before animation
    toast.offsetHeight;
    
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });
  }

  private animateOut(toast: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      
      setTimeout(() => {
        resolve();
      }, 300);
    });
  }

  private async removeToast(toast: HTMLElement): Promise<void> {
    if (!this.activeToasts.has(toast)) return;

    this.activeToasts.delete(toast);
    
    try {
      await this.animateOut(toast);
      toast.remove();
    } catch (error) {
      console.error('Error removing toast:', error);
      // Fallback: force remove
      toast.remove();
    }
  }

  private enforceMaxToasts(): void {
    if (this.activeToasts.size >= this.maxToasts) {
      const oldestToast = this.activeToasts.values().next().value;
      if (oldestToast) {
        this.removeToast(oldestToast);
      }
    }
  }

  show(options: ToastOptions): void {
    try {
      // Validate inputs
      if (!options.message?.trim()) {
        console.warn('Toast message is empty');
        return;
      }

      if (!this.toastContainer) {
        this.createContainer();
      }

      if (!this.toastContainer) {
        console.error('Failed to create toast container');
        return;
      }

      this.enforceMaxToasts();

      const toast = this.createToastElement(options);
      const duration = options.duration ?? 4000;

      this.toastContainer.appendChild(toast);
      this.activeToasts.add(toast);

      // Animate in
      this.animateIn(toast);

      // Auto-remove after duration
      const timeoutId = setTimeout(() => {
        this.removeToast(toast);
      }, duration);

      // Allow manual dismissal on click
      toast.addEventListener('click', () => {
        clearTimeout(timeoutId);
        this.removeToast(toast);
      }, { once: true });

    } catch (error) {
      console.error('Error showing toast:', error);
    }
  }

  // Clean up method for when content script is unloaded
  destroy(): void {
    this.activeToasts.clear();
    this.toastContainer?.remove();
    this.toastContainer = null;
  }
}