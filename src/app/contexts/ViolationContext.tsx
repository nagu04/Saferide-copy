import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Violation {
  id: string;
  type: string;
  date: string;
  location: string;
  amount: number;
  status: 'unpaid' | 'paid' | 'appealed';
  dueDate: string;
  plateNumber: string;
  canAppeal: boolean;
  paidDate?: string;
  appealDate?: string;
  imageUrl?: string;
}

export interface Payment {
  id: string;
  violationId: string;
  amount: number;
  paymentMethod: string;
  date: string;
  status: string;
  referenceNumber: string;
}

interface ViolationContextType {
  violations: Violation[];
  payments: Payment[];
  payViolation: (violationId: string, paymentMethod: string) => void;
  appealViolation: (violationId: string, reason: string) => void;
}

const ViolationContext = createContext<ViolationContextType | undefined>(undefined);

const INITIAL_VIOLATIONS: Violation[] = [
  {
    id: 'VIO-2024-001',
    type: 'No Helmet',
    date: '2024-02-20T14:32:00',
    location: 'Gate 1 Cam',
    amount: 1000,
    status: 'unpaid',
    dueDate: '2024-03-20',
    plateNumber: 'ABC-1234',
    canAppeal: true,
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'VIO-2024-002',
    type: 'Overloading',
    date: '2024-02-18T10:15:00',
    location: 'Main St Cam',
    amount: 1500,
    status: 'unpaid',
    dueDate: '2024-03-18',
    plateNumber: 'ABC-1234',
    canAppeal: true,
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'VIO-2023-045',
    type: 'No Helmet',
    date: '2024-01-15T16:20:00',
    location: 'Gate 2 Cam',
    amount: 1000,
    status: 'paid',
    paidDate: '2024-01-20',
    plateNumber: 'ABC-1234',
    canAppeal: false,
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'VIO-2023-032',
    type: 'No Plate',
    date: '2024-01-10T09:45:00',
    location: 'Gate 1 Cam',
    amount: 1200,
    status: 'appealed',
    appealDate: '2024-01-12',
    plateNumber: 'ABC-1234',
    canAppeal: false,
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=1200',
  },
];

const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'TXN-2024-001',
    violationId: 'VIO-2023-045',
    amount: 1000,
    paymentMethod: 'GCash',
    date: '2024-01-20T10:30:00',
    status: 'completed',
    referenceNumber: 'GCASH-123456789',
  },
  {
    id: 'TXN-2024-002',
    violationId: 'VIO-2023-038',
    amount: 1500,
    paymentMethod: 'Maya',
    date: '2024-01-05T14:15:00',
    status: 'completed',
    referenceNumber: 'MAYA-987654321',
  },
  {
    id: 'TXN-2023-089',
    violationId: 'VIO-2023-012',
    amount: 1200,
    paymentMethod: 'Credit Card',
    date: '2023-12-15T09:20:00',
    status: 'completed',
    referenceNumber: 'CARD-555666777',
  },
];

export function ViolationProvider({ children }: { children: ReactNode }) {
  const [violations, setViolations] = useState<Violation[]>(INITIAL_VIOLATIONS);
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS);

  const payViolation = (violationId: string, paymentMethod: string) => {
    // Update violation status to paid
    setViolations(prev =>
      prev.map(v =>
        v.id === violationId
          ? { ...v, status: 'paid' as const, paidDate: new Date().toISOString(), canAppeal: false }
          : v
      )
    );

    // Add payment record
    const violation = violations.find(v => v.id === violationId);
    if (violation) {
      const paymentMethodNames: Record<string, string> = {
        gcash: 'GCash',
        maya: 'Maya',
        card: 'Credit Card',
        bank: 'Bank Transfer',
      };

      const newPayment: Payment = {
        id: `TXN-${new Date().getFullYear()}-${String(payments.length + 1).padStart(3, '0')}`,
        violationId: violation.id,
        amount: violation.amount,
        paymentMethod: paymentMethodNames[paymentMethod] || paymentMethod,
        date: new Date().toISOString(),
        status: 'completed',
        referenceNumber: `${paymentMethod.toUpperCase()}-${Date.now()}`,
      };

      setPayments(prev => [newPayment, ...prev]);
    }
  };

  const appealViolation = (violationId: string, reason: string) => {
    setViolations(prev =>
      prev.map(v =>
        v.id === violationId
          ? { ...v, status: 'appealed' as const, appealDate: new Date().toISOString(), canAppeal: false }
          : v
      )
    );
  };

  return (
    <ViolationContext.Provider value={{ violations, payments, payViolation, appealViolation }}>
      {children}
    </ViolationContext.Provider>
  );
}

export function useViolations() {
  const context = useContext(ViolationContext);
  if (!context) {
    throw new Error('useViolations must be used within a ViolationProvider');
  }
  return context;
}
