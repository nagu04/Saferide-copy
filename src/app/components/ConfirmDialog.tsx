import React from 'react';
import { Button } from '@/app/components/ui/button';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogFooter,
} from '@/app/components/ui/alert-dialog';

import { 
  AlertTriangle,
  AlertCircle,
  XCircle,
  CheckCircle,
  Info
} from 'lucide-react';
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
        
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-full ${variantStyles.iconBg}`}>
            {variantStyles.icon}
          </div>

          <div>
            <AlertDialogTitle className="text-lg text-white">
              {title}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-slate-400 mt-2">
              {description}
            </AlertDialogDescription>
          </div>
        </div>

        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel
            disabled={loading}
            className="bg-slate-800 text-slate-300 hover:bg-slate-700"
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
        </AlertDialogFooter>

      </AlertDialogContent>
    </AlertDialog>
  );
}