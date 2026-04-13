import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { Toaster } from 'sonner';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { Layout } from '@/app/components/Layout';
import { UserLayout } from '@/app/components/UserLayout';
import { Dashboard } from '@/app/pages/Dashboard';
import { History } from '@/app/pages/History';
import { Settings } from '@/app/pages/Settings';
import { Login } from '@/app/pages/Login';
import { Incidents } from '@/app/pages/Incidents';
import { IncidentDetail } from '@/app/pages/IncidentDetail';
import { Reports } from '@/app/pages/Reports';
import { AuditLog } from '@/app/pages/AuditLog';
import { ModelMetrics } from '@/app/pages/ModelMetrics';
import { UserDashboard } from '@/app/pages/user/UserDashboard';
import { UserViolations } from '@/app/pages/user/UserViolations';
import { ViolationPayment } from '@/app/pages/user/ViolationPayment';
import { PaymentHistory } from '@/app/pages/user/PaymentHistory';
import { UserActivityLog } from '@/app/pages/user/UserActivityLog';
import { UserProfile } from '@/app/pages/user/UserProfile';
import { ViolationDetail } from '@/app/pages/user/ViolationDetail';
import { ViolationProvider } from '@/app/contexts/ViolationContext';

export default function App() {

  useEffect(() => {
    const wakeServer = async () => {
      try {
        await fetch("https://saferide-backend-1tqc.onrender.com/health");
        console.log("Server awake");
      } catch (e) {
        console.log("Server wake failed");
      }
    };

    wakeServer();
  }, []);
  return (
    <ViolationProvider>
      <BrowserRouter>
        {/* Global Toast Notifications */}
        <Toaster 
          position="top-right"
          expand={false}
          richColors
          closeButton
          duration={4000}
        />
        
        <Routes>
          {/* Public Route - Login */}
          <Route path="/" element={<Login />} />
          
          {/* Protected Admin Routes */}
          <Route element={
            <ProtectedRoute requiredRole="admin">
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/incidents/:id" element={<IncidentDetail />} />
            <Route path="/history" element={<History />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit" element={<AuditLog />} />
            <Route path="/metrics" element={<ModelMetrics />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Protected User Routes */}
          <Route element={
            <ProtectedRoute requiredRole="user">
              <UserLayout />
            </ProtectedRoute>
          }>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/violations" element={<UserViolations />} />
            <Route path="/user/violations/:id/payment" element={<ViolationPayment />} />
            <Route path="/user/payments" element={<PaymentHistory />} />
            <Route path="/user/activity" element={<UserActivityLog />} />
            <Route path="/user/profile" element={<UserProfile />} />
            <Route path="/user/violations/:id/detail" element={<ViolationDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ViolationProvider>
  );
}