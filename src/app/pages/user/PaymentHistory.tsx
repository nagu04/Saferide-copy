import React, { useState } from 'react';
import { Search, Calendar, Download, CheckCircle, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { showToast } from '@/app/utils/toast';
import { useViolations } from '@/app/contexts/ViolationContext';

export function PaymentHistory() {
  const { payments } = useViolations();
  const [filterMethod, setFilterMethod] = useState('All');

  const filteredPayments = payments.filter(payment => {
    if (filterMethod !== 'All' && payment.paymentMethod !== filterMethod) return false;
    return true;
  });

  const totalPaid = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);

  const handleDownloadReceipt = (payment: typeof payments[0]) => {
    // Generate receipt content
    const receipt = `
SAFERIDE VIOLATION PAYMENT RECEIPT
${'='.repeat(50)}

Receipt ID: ${payment.id}
Transaction Date: ${format(new Date(payment.date), 'MMM dd, yyyy HH:mm:ss')}
Reference Number: ${payment.referenceNumber}

PAYMENT DETAILS
${'-'.repeat(50)}
Violation ID: ${payment.violationId}
Payment Method: ${payment.paymentMethod}
Amount Paid: ₱${payment.amount.toLocaleString()}
Status: ${payment.status.toUpperCase()}

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
    a.download = `Receipt_${payment.id}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);

    showToast.success('Receipt downloaded successfully');
  };

  const handleExportCSV = () => {
    // Generate CSV content
    let csv = 'Transaction ID,Violation ID,Date,Time,Payment Method,Amount,Status,Reference Number\n';
    filteredPayments.forEach(payment => {
      const date = format(new Date(payment.date), 'yyyy-MM-dd');
      const time = format(new Date(payment.date), 'HH:mm:ss');
      csv += `${payment.id},${payment.violationId},${date},${time},${payment.paymentMethod},${payment.amount},${payment.status},${payment.referenceNumber}\n`;
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payment_History_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showToast.success('Payment records exported as CSV');
  };

  const handleExportPDF = () => {
    // Generate PDF-formatted text content
    let pdf = `SAFERIDE - PAYMENT HISTORY REPORT\n`;
    pdf += `${'='.repeat(80)}\n\n`;
    pdf += `Generated: ${new Date().toLocaleString()}\n`;
    pdf += `Total Records: ${filteredPayments.length}\n`;
    pdf += `Total Amount Paid: ₱${totalPaid.toLocaleString()}\n\n`;
    pdf += `PAYMENT RECORDS\n`;
    pdf += `${'-'.repeat(80)}\n\n`;

    filteredPayments.forEach((payment, idx) => {
      pdf += `[${idx + 1}] ${payment.id}\n`;
      pdf += `    Violation ID: ${payment.violationId}\n`;
      pdf += `    Date: ${format(new Date(payment.date), 'MMM dd, yyyy HH:mm:ss')}\n`;
      pdf += `    Payment Method: ${payment.paymentMethod}\n`;
      pdf += `    Amount: ₱${payment.amount.toLocaleString()}\n`;
      pdf += `    Status: ${payment.status.toUpperCase()}\n`;
      pdf += `    Reference: ${payment.referenceNumber}\n`;
      pdf += `\n`;
    });

    pdf += `${'='.repeat(80)}\n`;
    pdf += `End of Report\n`;

    // Download as text file
    const blob = new Blob([pdf], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payment_History_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);

    showToast.success('Payment records exported as PDF');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Payment History</h2>
          <p className="text-slate-400">View your past violation payments</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2">
          <div className="text-sm text-slate-400">Total Paid</div>
          <div className="text-xl font-bold text-green-400">₱{totalPaid.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search transaction ID..." 
            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="relative">
           <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
           <select 
            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-400 focus:outline-none appearance-none"
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
           >
             <option value="All">All Payment Methods</option>
             <option value="GCash">GCash</option>
             <option value="Maya">Maya</option>
             <option value="Credit Card">Credit Card</option>
             <option value="Bank Transfer">Bank Transfer</option>
           </select>
        </div>

        <div className="relative">
           <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
           <input 
             type="date"
             className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-400 focus:outline-none appearance-none"
           />
        </div>
      </div>

      {/* Payment History List */}
      {filteredPayments.length === 0 ? (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
          <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-white">No Payments Found</h3>
          <p className="text-slate-400 mt-2">You haven't made any payments yet.</p>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 text-slate-200 uppercase font-medium border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Violation ID</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-300 font-medium">{payment.id}</td>
                  <td className="px-6 py-4 font-mono text-slate-400">{payment.violationId}</td>
                  <td className="px-6 py-4">
                    <div className="text-slate-200">{format(new Date(payment.date), 'MMM dd, yyyy')}</div>
                    <div className="text-xs text-slate-500">{format(new Date(payment.date), 'HH:mm:ss')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {payment.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-200">
                    ₱{payment.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-green-400 bg-green-400/10">
                      <CheckCircle className="w-3 h-3" />
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium text-sm hover:underline" onClick={() => handleDownloadReceipt(payment)}>
                      <Download className="w-4 h-4" />
                      Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Export Options */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Export Payment Records</h3>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 transition-colors" onClick={handleExportCSV}>
            <Download className="w-4 h-4" />
            Export as CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 transition-colors" onClick={handleExportPDF}>
            <Download className="w-4 h-4" />
            Export as PDF
          </button>
        </div>
      </div>
    </div>
  );
}