import React, { useState } from 'react';
import { Search, Filter, Calendar, Clock, Download } from 'lucide-react';
import { format } from 'date-fns';
import { showToast } from '@/app/utils/toast';

const LOGS = [
  { id: 1, action: 'Login', user: 'admin', ip: '192.168.1.10', time: '2023-10-25T14:00:00', details: 'Successful login', type: 'auth' },
  { id: 2, action: 'Update Record', user: 'admin', ip: '192.168.1.10', time: '2023-10-25T14:05:22', details: 'Approved INC-2023-002 (Reason: Valid Violation)', type: 'record' },
  { id: 3, action: 'Export', user: 'admin', ip: '192.168.1.10', time: '2023-10-25T14:10:15', details: 'Generated PDF Report Batch #8841', type: 'export' },
  { id: 4, action: 'System Update', user: 'system', ip: 'localhost', time: '2023-10-25T14:32:05', details: 'New incident detected: INC-2023-001', type: 'system' },
  { id: 5, action: 'Settings Change', user: 'superadmin', ip: '10.0.0.5', time: '2023-10-25T13:50:00', details: 'Updated Confidence Threshold to 0.5', type: 'settings' },
  { id: 6, action: 'Login', user: 'admin', ip: '192.168.1.15', time: '2023-10-25T13:45:33', details: 'Successful login', type: 'auth' },
  { id: 7, action: 'Delete Record', user: 'admin', ip: '192.168.1.10', time: '2023-10-25T13:30:12', details: 'Deleted INC-2023-001 (Reason: False Positive)', type: 'delete' },
  { id: 8, action: 'Logout', user: 'admin', ip: '192.168.1.10', time: '2023-10-25T13:25:00', details: 'User logged out', type: 'auth' },
  { id: 9, action: 'Failed Login', user: 'unknown', ip: '203.0.113.5', time: '2023-10-25T13:20:18', details: 'Invalid credentials attempt', type: 'security' },
  { id: 10, action: 'Export', user: 'admin', ip: '192.168.1.10', time: '2023-10-25T13:15:44', details: 'Exported violation history CSV', type: 'export' },
  { id: 11, action: 'Update Record', user: 'admin', ip: '192.168.1.10', time: '2023-10-25T13:10:00', details: 'Rejected INC-2023-005 (Reason: Insufficient Evidence)', type: 'record' },
  { id: 12, action: 'Login', user: 'operator1', ip: '192.168.1.20', time: '2023-10-25T13:00:00', details: 'Successful login', type: 'auth' },
  { id: 13, action: 'System Update', user: 'system', ip: 'localhost', time: '2023-10-25T12:50:30', details: 'Database backup completed', type: 'system' },
  { id: 14, action: 'Settings Change', user: 'superadmin', ip: '10.0.0.5', time: '2023-10-25T12:40:00', details: 'Updated notification preferences', type: 'settings' },
  { id: 15, action: 'Export', user: 'admin', ip: '192.168.1.10', time: '2023-10-25T12:30:22', details: 'Generated monthly report', type: 'export' },
];

export function AuditLog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  const filteredLogs = LOGS.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip.includes(searchTerm);
    
    if (filterType !== 'All' && log.type !== filterType) return false;
    return matchesSearch;
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'auth':
        return '🔐';
      case 'record':
        return '📝';
      case 'export':
        return '📤';
      case 'system':
        return '⚙️';
      case 'settings':
        return '🔧';
      case 'delete':
        return '🗑️';
      case 'security':
        return '🔒';
      default:
        return '📌';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'auth':
        return 'text-blue-400 bg-blue-400/10 border-blue-500/20';
      case 'record':
        return 'text-green-400 bg-green-400/10 border-green-500/20';
      case 'export':
        return 'text-purple-400 bg-purple-400/10 border-purple-500/20';
      case 'system':
        return 'text-cyan-400 bg-cyan-400/10 border-cyan-500/20';
      case 'settings':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20';
      case 'delete':
        return 'text-red-400 bg-red-400/10 border-red-500/20';
      case 'security':
        return 'text-orange-400 bg-orange-400/10 border-orange-500/20';
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-500/20';
    }
  };

  const handleExportLogs = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Details', 'IP Address'];
    const csvData = filteredLogs.map(log => [
      format(new Date(log.time), 'yyyy-MM-dd HH:mm:ss'),
      log.user,
      log.action,
      `"${log.details}"`,
      log.ip
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast.success('Audit logs exported successfully');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">System Audit Log</h2>
        <p className="text-slate-400">Track all user actions and system events for compliance</p>
      </div>

      {/* Filters Section */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search audit logs..." 
            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative">
           <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
           <select 
            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-400 focus:outline-none appearance-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
           >
             <option value="All">All Action Types</option>
             <option value="auth">Authentication</option>
             <option value="record">Records</option>
             <option value="export">Exports</option>
             <option value="system">System</option>
             <option value="settings">Settings</option>
             <option value="delete">Deletions</option>
             <option value="security">Security</option>
           </select>
        </div>

        <div className="relative">
           <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
           <input 
             type="date"
             className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-400 focus:outline-none appearance-none"
           />
        </div>

        <button
          onClick={handleExportLogs}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Activity Timeline */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white">Audit Trail</h3>
        </div>

        <div className="divide-y divide-slate-800">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-6 hover:bg-slate-800/50 transition-colors">
              <div className="flex items-start gap-4">
                {/* Timeline Icon */}
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border ${getActivityColor(log.type)}`}>
                    {getActivityIcon(log.type)}
                  </div>
                </div>

                {/* Activity Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold text-white">{log.action}</h4>
                        <span className="text-xs text-slate-500">by {log.user}</span>
                      </div>
                      <p className="text-sm text-slate-400 mb-2">{log.details}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="font-mono">IP: {log.ip}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 flex-shrink-0">
                      <Clock className="w-4 h-4" />
                      <span>{format(new Date(log.time), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <div className="text-sm text-slate-400 mb-2">Total Events</div>
          <div className="text-2xl font-bold text-white">{LOGS.length}</div>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <div className="text-sm text-slate-400 mb-2">User Logins</div>
          <div className="text-2xl font-bold text-blue-400">
            {LOGS.filter(a => a.type === 'auth' && a.action === 'Login').length}
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <div className="text-sm text-slate-400 mb-2">Records Modified</div>
          <div className="text-2xl font-bold text-green-400">
            {LOGS.filter(a => a.type === 'record').length}
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <div className="text-sm text-slate-400 mb-2">Security Events</div>
          <div className="text-2xl font-bold text-red-400">
            {LOGS.filter(a => a.type === 'security').length}
          </div>
        </div>
      </div>
    </div>
  );
}