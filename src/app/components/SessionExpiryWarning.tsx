/**
 * Session Expiry Warning Component
 * Displays a warning when the user's session is about to expire
 */

import React, { useState, useEffect } from 'react';
import { Clock, X } from 'lucide-react';
import { componentStyles, transitions, cx, animations } from '@/app/utils/animations';

interface SessionExpiryWarningProps {
  onExtendSession: () => void;
  onLogout: () => void;
}

export function SessionExpiryWarning({ onExtendSession, onLogout }: SessionExpiryWarningProps) {
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds warning
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const checkExpiry = () => {
      try {
        let expiryTime: number;

        // For mock tokens
        if (token.startsWith('mock_jwt_token_')) {
          const timestamp = parseInt(token.split('_')[3]);
          expiryTime = timestamp + (24 * 60 * 60 * 1000); // 24 hours
        } else {
          // For real JWT tokens
          const payload = JSON.parse(atob(token.split('.')[1]));
          expiryTime = payload.exp * 1000;
        }

        const timeUntilExpiry = expiryTime - Date.now();
        const twoMinutes = 2 * 60 * 1000;

        // Show warning 2 minutes before expiry
        if (timeUntilExpiry > 0 && timeUntilExpiry <= twoMinutes) {
          setIsVisible(true);
          setTimeLeft(Math.floor(timeUntilExpiry / 1000));
        } else {
          setIsVisible(false);
        }
      } catch (error) {
        console.error('Error checking session expiry:', error);
      }
    };

    // Check immediately and then every 10 seconds
    checkExpiry();
    const interval = setInterval(checkExpiry, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const countdown = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [isVisible, onLogout]);

  if (!isVisible) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const resetTimer = () => {
    setTimeLeft(60);
    setIsVisible(false);
  };

  return (
    <div 
      className={cx(
        "fixed top-4 right-4 z-50 max-w-md",
        animations.fadeInZoom
      )}
    >
      <div className="bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="bg-yellow-500/20 p-2 rounded-lg">
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">Session Expiring Soon</h3>
            <p className="text-sm text-slate-300 mb-3">
              Your session will expire in{' '}
              <span className="font-mono font-bold text-yellow-400">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onExtendSession();
                  resetTimer();
                }}
                className={cx(
                  "px-3 py-1.5 bg-yellow-500 text-black font-medium text-sm rounded-lg",
                  "hover:bg-yellow-600",
                  transitions.colors,
                  "active:scale-95"
                )}
              >
                Extend Session
              </button>
              <button
                onClick={onLogout}
                className={cx(
                  "px-3 py-1.5 bg-slate-700 text-white font-medium text-sm rounded-lg",
                  "hover:bg-slate-600",
                  transitions.colors,
                  "active:scale-95"
                )}
              >
                Logout
              </button>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className={cx(
              "text-slate-400",
              "hover:text-white",
              transitions.colors
            )}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}