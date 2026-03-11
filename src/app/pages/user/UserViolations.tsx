import React, { useState } from 'react';
import { Link } from 'react-router';
import { Search, Filter, Calendar, MapPin, AlertCircle, Download, X } from 'lucide-react';
import { format } from 'date-fns';
import { showToast } from '@/app/utils/toast';
import { useViolations, Violation } from '@/app/contexts/ViolationContext';

export function UserViolations() {
  const { violations, appealViolation } = useViolations();
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [showAppealDialog, setShowAppealDialog] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [appealReason, setAppealReason] = useState('');

  const filteredViolations = violations.filter(violation => {
    if (filterStatus !== 'All' && violation.status !== filterStatus) return false;
    if (filterType !== 'All' && violation.type !== filterType) return false;
    return true;
  });

  const totalDue = filteredViolations
    .filter(v => v.status === 'unpaid')
    .reduce((sum, v) => sum + v.amount, 0);

  const handleAppealClick = (violation: Violation) => {
    setSelectedViolation(violation);
    setShowAppealDialog(true);
  };

  const handleSubmitAppeal = () => {
    if (!appealReason.trim()) {
      showToast.error('Please provide a reason for your appeal');
      return;
    }

    if (selectedViolation) {
      appealViolation(selectedViolation.id, appealReason);
      showToast.success(`Appeal submitted for ${selectedViolation.id}. You will be notified of the decision.`);
    }

    setShowAppealDialog(false);
    setAppealReason('');
    setSelectedViolation(null);
  };

  const handleDownloadReceipt = (violation: Violation) => {
    // Generate receipt content
    const receipt = `
SAFERIDE VIOLATION PAYMENT RECEIPT
${'='.repeat(50)}

Receipt ID: RCP-${violation.id.split('-')[2]}-${new Date().getFullYear()}
Violation ID: ${violation.id}
Payment Date: ${violation.paidDate || 'N/A'}

VIOLATION DETAILS
${'-'.repeat(50)}
Type: ${violation.type}
Date: ${format(new Date(violation.date), 'MMM dd, yyyy HH:mm:ss')}
Location: ${violation.location}
Plate Number: ${violation.plateNumber}

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">My Violations</h2>
          <p className="text-slate-400">View and manage your traffic violations</p>
        </div>
        {totalDue > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
            <div className="text-sm text-slate-400">Total Due</div>
            <div className="text-xl font-bold text-red-400">₱{totalDue.toLocaleString()}</div>
          </div>
        )}
      </div>

      {/* Filters Section */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search ID..." 
            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="relative">
           <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
           <select 
            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-400 focus:outline-none appearance-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
           >
             <option value="All">All Violation Types</option>
             <option value="No Helmet">No Helmet</option>
             <option value="No Plate">No Plate</option>
             <option value="Overloading">Overloading</option>
           </select>
        </div>

        <div className="relative">
           <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
           <select 
            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-400 focus:outline-none appearance-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
           >
             <option value="All">All Statuses</option>
             <option value="unpaid">Unpaid</option>
             <option value="paid">Paid</option>
             <option value="appealed">Appealed</option>
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

      {/* Violations List */}
      {filteredViolations.length === 0 ? (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
          <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-white">No Violations Found</h3>
          <p className="text-slate-400 mt-2">Try adjusting your filters or search criteria.</p>
          <button 
            onClick={() => {setFilterStatus('All'); setFilterType('All')}}
            className="mt-4 text-blue-400 hover:text-blue-300 font-medium"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 text-slate-200 uppercase font-medium border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Violation ID</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredViolations.map((violation) => (
                <tr key={violation.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-300 font-medium">{violation.id}</td>
                  <td className="px-6 py-4">
                    <div className="text-slate-200">{format(new Date(violation.date), 'MMM dd, yyyy')}</div>
                    <div className="text-xs text-slate-500">{format(new Date(violation.date), 'HH:mm:ss')}</div>
                  </td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    {violation.location}
                  </td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      violation.type === 'No Helmet' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                      violation.type === 'No Plate' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {violation.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-200">
                    ₱{violation.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      violation.status === 'paid' ? 'text-green-400 bg-green-400/10' :
                      violation.status === 'appealed' ? 'text-blue-400 bg-blue-400/10' :
                      'text-red-400 bg-red-400/10'
                    }`}>
                      {violation.status.charAt(0).toUpperCase() + violation.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {violation.status === 'unpaid' && (
                        <>
                          <Link
                            to={`/user/violations/${violation.id}/payment`}
                            className="text-blue-400 hover:text-blue-300 font-medium text-sm hover:underline"
                          >
                            Pay
                          </Link>
                          {violation.canAppeal && (
                            <button 
                              className="text-slate-400 hover:text-slate-300 font-medium text-sm hover:underline"
                              onClick={() => handleAppealClick(violation)}
                            >
                              Appeal
                            </button>
                          )}
                        </>
                      )}
                      {violation.status === 'paid' && (
                        <button 
                          className="flex items-center gap-1 text-slate-400 hover:text-slate-300 font-medium text-sm"
                          onClick={() => handleDownloadReceipt(violation)}
                        >
                          <Download className="w-4 h-4" />
                          Receipt
                        </button>
                      )}
                      {violation.status === 'appealed' && (
                        <span className="text-slate-500 text-sm">Under Review</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Appeal Dialog */}
      {showAppealDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Appeal Violation</h3>
              <button 
                className="text-slate-400 hover:text-slate-300"
                onClick={() => setShowAppealDialog(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-400 mb-4">Violation ID: {selectedViolation?.id}</p>
            <textarea 
              className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your appeal reason here..."
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end mt-4">
              <button 
                className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-400"
                onClick={handleSubmitAppeal}
              >
                Submit Appeal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}