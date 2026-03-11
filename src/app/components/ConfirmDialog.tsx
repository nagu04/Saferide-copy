import React from 'react';
import { Button } from '@/app/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { componentStyles, cx, animations } from '@/app/utils/animations';

type ConfirmDialogVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  loading = false,
}: ConfirmDialogProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <XCircle className="w-6 h-6 text-red-500" />,
          iconBg: 'bg-red-500/10',
          buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-orange-500" />,
          iconBg: 'bg-orange-500/10',
          buttonClass: 'bg-orange-600 hover:bg-orange-700 text-white',
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-500" />,
          iconBg: 'bg-green-500/10',
          buttonClass: 'bg-green-600 hover:bg-green-700 text-white',
        };
      case 'info':
        return {
          icon: <Info className="w-6 h-6 text-blue-500" />,
          iconBg: 'bg-blue-500/10',
          buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
      default:
        return {
          icon: <Info className="w-6 h-6 text-slate-500" />,
          iconBg: 'bg-slate-500/10',
          buttonClass: 'bg-slate-600 hover:bg-slate-700 text-white',
        };
    }
  };

  const variantStyles = getVariantStyles();

  const onCancel = () => {
    onOpenChange(false);
  };

  return (
    <div
      className={cx(
        componentStyles.dialogOverlay,
        'p-4'
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className={cx(
        componentStyles.dialogContent,
        'w-full max-w-md'
      )}>
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-full ${variantStyles.iconBg} flex-shrink-0`}>
            {variantStyles.icon}
          </div>
          <div className="flex-1 pt-1">
            <AlertDialogTitle className="text-white text-lg">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 mt-2">
              {description}
            </AlertDialogDescription>
          </div>
        </div>
        <div className="mt-6">
          <AlertDialogCancel
            disabled={loading}
            className="bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className={`${variantStyles.buttonClass} disabled:opacity-50`}
          >
            {loading ? 'Processing...' : confirmText}
          </AlertDialogAction>
        </div>
      </div>
    </div>
  );
}