/**
 * Protected Route Component
 * Handles authentication and authorization for routes
 */

import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '@/app/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole, user } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requiredRole && !hasRole(requiredRole)) {
    // Redirect to appropriate dashboard based on actual role
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'admin') {
      return <Navigate to="/dashboard" replace />;
    } else if (userRole === 'user') {
      return <Navigate to="/user/dashboard" replace />;
    }
    // Fallback to login if role is unclear
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}