import React from 'react';
import { Link } from 'react-router';
import { AlertCircle, CreditCard, CheckCircle, Clock, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { useViolations, Violation } from '@/app/contexts/ViolationContext';
import { showToast } from '@/app/utils/toast';
import { useEffect, useState } from "react";
import { fetchViolations } from "@/app/violationsApi";


export function UserDashboard() {
  const [violations, setViolations] = useState<any[]>([]);
  //const [payments, setPayments] = useState<any[]>([]); // placeholder for now
  const [loading, setLoading] = useState(true);

  // Calculate stats dynamically
  const totalViolations = violations.length;
  const pendingPayments = violations.filter(v => v.payment_status === 'unpaid').length;
  const paidViolations = violations.filter(v => v.payment_status === 'paid').length;
  const totalAmountDue = violations.filter(v => v.payment_status === 'unpaid').reduce((sum, v) => sum + v.amount, 0);
  const totalPaid = violations
    .filter(v => v.payment_status === "paid")
    .reduce((sum, v) => sum + v.amount, 0);

  // Get recent violations (last 3)
  const recentViolations = [...violations]
    .sort((a, b) =>
      new Date(b.timestamp || 0).getTime() -
      new Date(a.timestamp || 0).getTime()
    )
    .slice(0, 3);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchViolations();
        setViolations(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();

    // OPTIONAL: realtime sync (same as admin)
    const interval = setInterval(load, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleDownloadReceipt = (violation: Violation) => {
    // Generate receipt content
    const receipt = `
SAFERIDE VIOLATION PAYMENT RECEIPT
${'='.repeat(50)}

Receipt ID: RCP-${violation.id.split('-')[2]}-${new Date().getFullYear()}
Violation ID: ${violation.id}
Payment Date: ${violation.paidDate ? format(new Date(violation.paidDate), 'MMM dd, yyyy') : 'N/A'}

VIOLATION DETAILS
${'-'.repeat(50)}
Type: ${violation.violation_type}
Date: ${format(new Date(violation.timestamp), 'MMM dd, yyyy HH:mm:ss')}
Location: ${violation.location}
Plate Number: ${violation.plate_number}

PAYMENT INFORMATION
${'-'.repeat(50)}
Amount Paid: ₱${violation.amount.toLocaleString()}
Payment Method: GCash
Status: PAID

${'='.repeat(50)}
This is an official receipt for your payment.
For inquiries, contact SafeRide Support.

Generated: ${new Date().toLocaleString()}
    `.trim();

    // Download as text file
    const blob = new Blob([receipt], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${violation.id}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);

    showToast.success('Receipt downloaded successfully');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
        <p className="text-slate-600">Here's an overview of your violations and payments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0 }}
        >
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:shadow-lg hover:shadow-slate-950/50 cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-500/10 p-3 rounded-lg transition-transform duration-300 group-hover:scale-110">
                <AlertCircle className="w-6 h-6 text-orange-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{totalViolations}</div>
            <div className="text-sm text-slate-700">Total Violations</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:shadow-lg hover:shadow-slate-950/50 cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-500/10 p-3 rounded-lg transition-transform duration-300 group-hover:scale-110">
                <Clock className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">₱{totalAmountDue.toLocaleString()}</div>
            <div className="text-sm text-slate-700">Amount Due</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:shadow-lg hover:shadow-slate-950/50 cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-500/10 p-3 rounded-lg transition-transform duration-300 group-hover:scale-110">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{paidViolations}</div>
            <div className="text-sm text-slate-700">Paid Violations</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:shadow-lg hover:shadow-slate-950/50 cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-500/10 p-3 rounded-lg transition-transform duration-300 group-hover:scale-110">
                <CreditCard className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">₱{totalPaid.toLocaleString()}</div>
            <div className="text-sm text-slate-700">Total Paid</div>
          </div>
        </motion.div>
      </div>

      {/* Pending Payments Alert */}
      {pendingPayments > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-400 mb-1">Pending Payments</h3>
            <p className="text-sm text-slate-300">
              You have {pendingPayments} unpaid violation(s) totaling ₱{totalAmountDue.toLocaleString()}. 
              Please settle your payments to avoid additional penalties.
            </p>
            <Link 
              to="/user/violations"
              className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-red-400 hover:text-red-300"
            >
              View Violations →
            </Link>
          </div>
        </div>
      )}

      {/* Recent Violations */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Recent Violations</h3>
            <p className="text-sm text-slate-600 mt-1">Your latest traffic violations</p>
          </div>
          <Link 
            to="/user/violations"
            className="text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            View All
          </Link>
        </div>

        <div className="divide-y divide-slate-800">
          {recentViolations.map((violation) => (
            <div key={violation.id} className="p-6 hover:bg-slate-800/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono font-semibold text-slate-200">{violation.id}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      violation.payment_status === 'paid' 
                        ? 'text-green-400 bg-green-400/10' 
                        : 'text-red-400 bg-red-400/10'
                    }`}>
                      {violation.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-500/10 text-orange-400">
                      {violation.violation_type}
                    </span>
                  </div>
                  <div className="text-sm text-slate-400 space-y-1">
                    <div>Date: {format(new Date(violation.timestamp), 'MMM dd, yyyy HH:mm')}</div>
                    <div>Location: {violation.location}</div>
                    {violation.payment_status === 'unpaid' && (
                      <div className="text-red-400">Due: {format(new Date(violation.dueDate), 'MMM dd, yyyy')}</div>
                    )}
                    {violation.payment_status === 'paid' && violation.paidDate && (
                      <div className="text-green-400">Paid: {format(new Date(violation.paidDate), 'MMM dd, yyyy')}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white mb-2">₱{violation.amount.toLocaleString()}</div>
                  {violation.payment_status === 'unpaid' && (
                    <Link
                      to={`/user/violations/${violation.id}/payment`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Pay Now
                    </Link>
                  )}
                  {violation.payment_status === 'paid' && (
                    <button
                      onClick={() => handleDownloadReceipt(violation)}
                      className="text-sm text-slate-400 hover:text-slate-300"
                    >
                      View Receipt
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}