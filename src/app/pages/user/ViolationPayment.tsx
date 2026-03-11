import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { AlertCircle, CreditCard, Calendar, MapPin, CheckCircle, ArrowLeft, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { showToast } from '@/app/utils/toast';
import { useViolations } from '@/app/contexts/ViolationContext';

export function ViolationPayment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { violations, payViolation } = useViolations();
  const [paymentMethod, setPaymentMethod] = useState<'gcash' | 'maya' | 'card' | 'bank'>('gcash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Get violation from context
  const violation = violations.find(v => v.id === id);

  // If violation not found, redirect
  if (!violation) {
    navigate('/user/violations');
    return null;
  }

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update violation status in context
      payViolation(violation.id, paymentMethod);
      
      setIsProcessing(false);
      setShowSuccess(true);
      
      // Show success toast
      showToast.paymentSuccess(violation.amount, getPaymentMethodName(paymentMethod));
      
      // Redirect after success
      setTimeout(() => {
        navigate('/user/violations');
      }, 3000);
    } catch (error) {
      setIsProcessing(false);
      showToast.paymentFailed('Payment processing error. Please try again.');
    }
  };
  
  const getPaymentMethodName = (method: string) => {
    const methods: Record<string, string> = {
      gcash: 'GCash',
      maya: 'Maya',
      card: 'Credit/Debit Card',
      bank: 'Bank Transfer',
    };
    return methods[method] || method;
  };

  if (showSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center max-w-md">
          <div className="bg-green-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
          <p className="text-slate-400 mb-6">
            Your payment of ₱{violation.amount.toLocaleString()} has been processed successfully.
          </p>
          <div className="bg-slate-950 rounded-lg p-4 mb-6">
            <div className="text-sm text-slate-400 mb-1">Transaction ID</div>
            <div className="font-mono font-semibold text-blue-400">TXN-{Date.now()}</div>
          </div>
          <p className="text-sm text-slate-500">
            Redirecting to violations page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate('/user/violations')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Violations
        </button>
        <h2 className="text-2xl font-bold text-white">Payment</h2>
        <p className="text-slate-400">Complete your violation payment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Violation Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-1">Violation Details</h3>
              <p className="text-sm text-slate-400">Review the violation information</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Violation ID</div>
                  <div className="font-mono font-semibold text-slate-200">{violation.id}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Type</div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    {violation.type}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Date & Time
                  </div>
                  <div className="text-slate-200">{format(new Date(violation.date), 'MMM dd, yyyy HH:mm')}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Location
                  </div>
                  <div className="text-slate-200">{violation.location}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Plate Number</div>
                  <div className="font-mono text-slate-200">{violation.plateNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Due Date</div>
                  <div className="text-red-400">{format(new Date(violation.dueDate), 'MMM dd, yyyy')}</div>
                </div>
              </div>

              {/* Evidence Image */}
              <div>
                <div className="text-sm text-slate-400 mb-2">Evidence Photo</div>
                <img 
                  src={violation.imageUrl} 
                  alt="Violation evidence"
                  className="w-full h-64 object-cover rounded-lg border border-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-1">Payment Method</h3>
              <p className="text-sm text-slate-400">Select your preferred payment option</p>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentMethod('gcash')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'gcash'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white">GCash</div>
                    <div className="text-xs text-slate-400">E-wallet payment</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('maya')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'maya'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white">Maya</div>
                    <div className="text-xs text-slate-400">E-wallet payment</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white">Credit/Debit Card</div>
                    <div className="text-xs text-slate-400">Visa, Mastercard</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('bank')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'bank'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white">Bank Transfer</div>
                    <div className="text-xs text-slate-400">Online banking</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden sticky top-4">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">Payment Summary</h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Violation Fine</span>
                <span className="text-white font-semibold">₱{violation.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Processing Fee</span>
                <span className="text-white font-semibold">₱0</span>
              </div>
              
              <div className="border-t border-slate-800 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-white">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-400">₱{violation.amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-300">
                    By proceeding with this payment, you agree to the terms and conditions of the SafeRide violation payment system.
                  </p>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Pay ₱${violation.amount.toLocaleString()}`
                )}
              </button>

              <p className="text-xs text-center text-slate-500">
                Secure payment powered by SafeRide
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}