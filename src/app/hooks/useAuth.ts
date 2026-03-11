/**
 * Authentication Hook
 * Manages authentication state and provides auth utilities
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getCurrentUser } from '@/app/services/api';
import { showToast } from '@/app/utils/toast';
import type { User } from '@/app/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    
    // Check token expiration every minute
    const interval = setInterval(() => {
      checkTokenExpiration();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('access_token');
    const user = getCurrentUser();

    if (token && user) {
      // Check if token is expired
      if (isTokenExpired(token)) {
        handleLogout();
      } else {
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      }
    } else {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const checkTokenExpiration = () => {
    const token = localStorage.getItem('access_token');
    
    if (token && isTokenExpired(token)) {
      handleLogout();
    }
  };

  const isTokenExpired = (token: string): boolean => {
    try {
      // For mock tokens (format: mock_jwt_token_TIMESTAMP)
      if (token.startsWith('mock_jwt_token_')) {
        const timestamp = parseInt(token.split('_')[3]);
        const expirationTime = timestamp + (24 * 60 * 60 * 1000); // 24 hours
        return Date.now() > expirationTime;
      }

      // For real JWT tokens
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() > exp;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // Assume expired if can't parse
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('userRole');
    
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    showToast.info('Logged Out', 'You have been successfully logged out.');

    navigate('/', { replace: true });
  };

  const extendSession = () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    // For mock tokens, create a new token with updated timestamp
    if (token.startsWith('mock_jwt_token_')) {
      const newToken = 'mock_jwt_token_' + Date.now();
      localStorage.setItem('access_token', newToken);
      
      // In production, you would call an API endpoint to refresh the token
      // const newToken = await api.auth.refreshToken();
      // localStorage.setItem('access_token', newToken);
    }
  };

  const hasRole = (requiredRole: 'admin' | 'user'): boolean => {
    if (!authState.user) return false;
    
    // Check stored user role
    const storedRole = localStorage.getItem('userRole');
    
    if (requiredRole === 'admin') {
      return storedRole === 'admin' || authState.user.role === 'admin';
    }
    
    if (requiredRole === 'user') {
      return storedRole === 'user';
    }
    
    return false;
  };

  return {
    ...authState,
    checkAuth,
    logout: handleLogout,
    extendSession,
    hasRole,
  };
}