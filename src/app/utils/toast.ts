/**
 * Toast Notification Utilities
 * Provides consistent toast notifications throughout the application
 */

import { toast } from 'sonner';
import { TriangleAlert, CheckCircle2, XCircle, Info, Bell, Shield } from 'lucide-react';

// Toast icons
const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: TriangleAlert,
  info: Info,
  alert: Bell,
  security: Shield,
};

// Custom toast with icons
export const showToast = {
  /**
   * Success toast - for successful operations
   */
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      icon: '✓',
      duration: 4000,
    });
  },

  /**
   * Error toast - for failed operations
   */
  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      icon: '✕',
      duration: 5000,
    });
  },

  /**
   * Warning toast - for warnings and alerts
   */
  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      icon: '⚠',
      duration: 5000,
    });
  },

  /**
   * Info toast - for informational messages
   */
  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      icon: 'ℹ',
      duration: 4000,
    });
  },

  /**
   * Real-time violation alert - for new violations
   */
  violationAlert: (
  violationType: string,
  location: string,
  plateNumber?: string,
  onView?: () => void
  ) => {
    toast.error('New Violation Detected!', {
      description: `${violationType} violation at ${location}${plateNumber ? ` - Plate: ${plateNumber}` : ''}`,
      icon: '🚨',
      duration: 6000,
      action: {
        label: 'View',
        onClick: () => {
          if (onView) onView();
        },
      },
    });
  },

  /**
   * Incident approval toast
   */
  incidentApproved: (incidentId: string) => {
    toast.success('Incident Approved', {
      description: `Incident #${incidentId} has been approved and filed.`,
      icon: '✓',
      duration: 4000,
    });
  },

  /**
   * Incident rejection toast
   */
  incidentRejected: (incidentId: string, reason?: string) => {
    toast.info('Incident Rejected', {
      description: reason 
        ? `Incident #${incidentId} rejected: ${reason}`
        : `Incident #${incidentId} has been rejected.`,
      icon: 'ℹ',
      duration: 4000,
    });
  },

  /**
   * System status toast
   */
  systemStatus: (status: 'online' | 'offline' | 'maintenance', message?: string) => {
    const statusConfig = {
      online: {
        type: 'success' as const,
        title: 'System Online',
        description: message || 'All systems are operational.',
        icon: '✓',
      },
      offline: {
        type: 'error' as const,
        title: 'System Offline',
        description: message || 'Unable to connect to the server.',
        icon: '✕',
      },
      maintenance: {
        type: 'warning' as const,
        title: 'Maintenance Mode',
        description: message || 'System is under maintenance.',
        icon: '⚠',
      },
    };

    const config = statusConfig[status];
    toast[config.type](config.title, {
      description: config.description,
      icon: config.icon,
      duration: 6000,
    });
  },

  /**
   * Model performance alert
   */
  modelAlert: (accuracy: number, threshold: number) => {
    toast.warning('Model Performance Alert', {
      description: `Detection accuracy (${accuracy.toFixed(1)}%) is below threshold (${threshold}%)`,
      icon: '⚠',
      duration: 6000,
    });
  },

  /**
   * Data export toast
   */
  exportStarted: (format: string) => {
    toast.info('Export Started', {
      description: `Preparing ${format.toUpperCase()} export...`,
      icon: 'ℹ',
      duration: 3000,
    });
  },

  exportComplete: (format: string, recordCount: number) => {
    toast.success('Export Complete', {
      description: `Successfully exported ${recordCount} records as ${format.toUpperCase()}`,
      icon: '✓',
      duration: 4000,
    });
  },

  /**
   * Settings update toast
   */
  settingsUpdated: (settingName?: string) => {
    toast.success('Settings Updated', {
      description: settingName 
        ? `${settingName} has been updated successfully.`
        : 'Your settings have been saved.',
      icon: '✓',
      duration: 3000,
    });
  },

  /**
   * Payment toast
   */
  paymentSuccess: (amount: number, method: string) => {
    toast.success('Payment Successful', {
      description: `₱${amount.toFixed(2)} paid via ${method}`,
      icon: '✓',
      duration: 5000,
    });
  },

  paymentFailed: (reason?: string) => {
    toast.error('Payment Failed', {
      description: reason || 'Unable to process payment. Please try again.',
      icon: '✕',
      duration: 5000,
    });
  },

  /**
   * Promise toast - for loading states
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ): Promise<T> => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  },

  /**
   * Custom toast with action button
   */
  withAction: (
    message: string,
    actionLabel: string,
    onAction: () => void,
    description?: string
  ) => {
    toast(message, {
      description,
      duration: 6000,
      action: {
        label: actionLabel,
        onClick: onAction,
      },
    });
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },
};

// Specific toast types for common operations
export const incidentToasts = {
  approving: (id: string) => 
    showToast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: `Approving incident #${id}...`,
        success: `Incident #${id} approved successfully`,
        error: `Failed to approve incident #${id}`,
      }
    ),

  rejecting: (id: string) =>
    showToast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: `Rejecting incident #${id}...`,
        success: `Incident #${id} rejected`,
        error: `Failed to reject incident #${id}`,
      }
    ),
};

export const dataToasts = {
  loading: (action: string) => 
    toast.loading(action, {
      duration: Infinity,
    }),

  dismiss: () => toast.dismiss(),
};
