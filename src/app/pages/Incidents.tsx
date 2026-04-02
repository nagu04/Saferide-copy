import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Search, Filter, Calendar, MapPin, AlertTriangle, Trash2, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import { api } from '@/app/services/api';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';
import { showToast } from '@/app/utils/toast';
import { Checkbox } from '@/app/components/ui/checkbox';
import { useWebSocket } from '@/app/services/websocket';




export function Incidents() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [selectedIncidents, setSelectedIncidents] = useState<string[]>([]);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'delete' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchIncidents = async () => {
      setLoading(true);
      try {
        const recent = await api.dashboard.getRecentViolations(50);

        const mapped = (recent || []).map(v => ({
          id: v.id,
          date: v.timestamp,
          location: v.location,
          type: v.detections?.[0]?.type || 'Unknown',
          status: v.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          confidence: v.detections?.[0]?.confidence || 0
        }));

        mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setIncidents(mapped);
      } catch (err) {
        console.error(err);
        showToast.error('Failed to load incidents');
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  useWebSocket((msg) => {
    if (msg.type === 'new_violation') {
      const v = msg.data;

      const newIncident = {
        id: v.id,
        date: v.timestamp,
        location: v.location,
        type: v.detections?.[0]?.type || 'Unknown',
        status: v.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        confidence: v.detections?.[0]?.confidence || 0
      };

      setIncidents(prev => {
        if (prev.find(i => i.id === newIncident.id)) return prev;
        return [newIncident, ...prev];
      });
    }

    if (msg.type === 'update_violation') {
      const updated = msg.data;

      setIncidents(prev =>
        prev.map(i =>
          i.id === updated.id
            ? {
                ...i,
                status: updated.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
              }
            : i
        )
      );
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading incidents...</div>
      </div>
    );
  }

  const filteredIncidents = incidents.filter(incident => {
    if (filterStatus !== 'All' && incident.status !== filterStatus) return false;
    if (filterType !== 'All' && incident.type !== filterType) return false;
    return true;
  });

  const toggleSelectAll = () => {
    if (selectedIncidents.length === filteredIncidents.length) {
      setSelectedIncidents([]);
    } else {
      setSelectedIncidents(filteredIncidents.map(i => i.id));
    }
  };

  const toggleSelectIncident = (id: string) => {
    setSelectedIncidents(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkAction = (action: 'approve' | 'reject' | 'delete') => {
    if (selectedIncidents.length === 0) {
      showToast.error('No Selection', 'Please select at least one incident to perform bulk actions.');
      return;
    }
    setBulkAction(action);
    setShowBulkConfirm(true);
  };

  const executeBulkAction = async () => {
    setIsProcessing(true);
    setShowBulkConfirm(false);
    
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const count = selectedIncidents.length;
      
      if (bulkAction === 'approve') {
        showToast.success('Bulk Approval Complete', `${count} incident(s) have been approved successfully.`);
      } else if (bulkAction === 'reject') {
        showToast.success('Bulk Rejection Complete', `${count} incident(s) have been rejected successfully.`);
      } else if (bulkAction === 'delete') {
        showToast.success('Bulk Delete Complete', `${count} incident(s) have been deleted successfully.`);
      }
      
      setSelectedIncidents([]);
      setBulkAction(null);
      
    } catch (error) {
      showToast.error('Bulk Action Failed', 'Unable to process bulk action. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Incidents</h2>
          <p className="text-slate-400">Review and process detected violations</p>
        </div>
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
           <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
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
             <option value="Pending">Pending</option>
             <option value="Approved">Approved</option>
             <option value="Rejected">Rejected</option>
             <option value="Needs Info">Needs Info</option>
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

      {/* Incidents List */}
      {filteredIncidents.length === 0 ? (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
          <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-white">No Incidents Found</h3>
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
                <th className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedIncidents.length === filteredIncidents.length && filteredIncidents.length > 0}
                      onCheckedChange={toggleSelectAll}
                      className="border-slate-600"
                    />
                    Incident ID
                  </div>
                </th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Confidence</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredIncidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-300 font-medium">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={selectedIncidents.includes(incident.id)}
                        onCheckedChange={() => toggleSelectIncident(incident.id)}
                        className="border-slate-600"
                      />
                      {incident.id}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-200">{format(new Date(incident.date), 'MMM dd, yyyy')}</div>
                    <div className="text-xs text-slate-500">{format(new Date(incident.date), 'HH:mm:ss')}</div>
                  </td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    {incident.location}
                  </td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      incident.type === 'No Helmet' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                      incident.type === 'No Plate' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {incident.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${incident.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs">{(incident.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      incident.status === 'Approved' ? 'text-green-400 bg-green-400/10' :
                      incident.status === 'Rejected' ? 'text-red-400 bg-red-400/10' :
                      incident.status === 'Needs Info' ? 'text-blue-400 bg-blue-400/10' :
                      'text-slate-400 bg-slate-400/10'
                    }`}>
                      {incident.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link 
                      to={`/incidents/${incident.id}`}
                      className="text-blue-400 hover:text-blue-300 font-medium text-sm hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedIncidents.length > 0 && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 flex items-center justify-between">
          <div className="text-slate-300 flex items-center gap-2">
            <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-sm font-bold">
              {selectedIncidents.length}
            </span>
            incident(s) selected
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleBulkAction('approve')}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Approve
            </button>
            <button 
              onClick={() => handleBulkAction('reject')}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Reject
            </button>
            <button 
              onClick={() => handleBulkAction('delete')}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={showBulkConfirm}
        onOpenChange={setShowBulkConfirm}
        onConfirm={executeBulkAction}
        title={`Confirm Bulk ${bulkAction === 'approve' ? 'Approval' : bulkAction === 'reject' ? 'Rejection' : 'Deletion'}`}
        description={
          bulkAction === 'approve' 
            ? `Are you sure you want to approve ${selectedIncidents.length} incident(s)? This will mark them as valid violations and may trigger notifications to violators.`
            : bulkAction === 'reject'
            ? `Are you sure you want to reject ${selectedIncidents.length} incident(s)? This will mark them as false positives or invalid detections.`
            : `Are you sure you want to permanently delete ${selectedIncidents.length} incident(s)? This action cannot be undone and will remove all associated evidence.`
        }
        confirmText={
          bulkAction === 'approve' ? `Approve ${selectedIncidents.length} Incident(s)` :
          bulkAction === 'reject' ? `Reject ${selectedIncidents.length} Incident(s)` :
          `Delete ${selectedIncidents.length} Incident(s)`
        }
        variant={
          bulkAction === 'approve' ? 'success' :
          bulkAction === 'delete' ? 'danger' :
          'warning'
        }
        loading={isProcessing}
      />
    </div>
  );
}