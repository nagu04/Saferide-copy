import React, { useState } from 'react';
import { Search, Calendar, Filter, Clock } from 'lucide-react';
import { format } from 'date-fns';

const ACTIVITY_LOG = [
  { 
    id: 1, 
    action: 'Payment Made', 
    description: 'Paid violation VIO-2023-045 via GCash', 
    timestamp: '2024-01-20T10:30:00',
    type: 'payment',
  },
  { 
    id: 2, 
    action: 'Login', 
    description: 'Logged in from Chrome on Windows', 
    timestamp: '2024-01-20T09:15:00',
    type: 'auth',
  },
  { 
    id: 3, 
    action: 'Profile Updated', 
    description: 'Updated contact number', 
    timestamp: '2024-01-15T14:22:00',
    type: 'profile',
  },
  { 
    id: 4, 
    action: 'Payment Made', 
    description: 'Paid violation VIO-2023-038 via Maya', 
    timestamp: '2024-01-05T14:15:00',
    type: 'payment',
  },
  { 
    id: 5, 
    action: 'Violation Appeal', 
    description: 'Submitted appeal for VIO-2023-032', 
    timestamp: '2024-01-12T11:30:00',
    type: 'appeal',
  },
  { 
    id: 6, 
    action: 'Login', 
    description: 'Logged in from Safari on iPhone', 
    timestamp: '2024-01-05T08:45:00',
    type: 'auth',
  },
  { 
    id: 7, 
    action: 'Receipt Downloaded', 
    description: 'Downloaded receipt for VIO-2023-045', 
    timestamp: '2024-01-20T10:35:00',
    type: 'document',
  },
  { 
    id: 8, 
    action: 'Password Changed', 
    description: 'Password was successfully changed', 
    timestamp: '2023-12-28T16:20:00',
    type: 'security',
  },
];

export function UserActivityLog() {
  const [filterType, setFilterType] = useState('All');

  const filteredActivities = ACTIVITY_LOG.filter(activity => {
    if (filterType !== 'All' && activity.type !== filterType) return false;
    return true;
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return '💳';
      case 'auth':
        return '🔐';
      case 'profile':
        return '👤';
      case 'appeal':
        return '📋';
      case 'document':
        return '📄';
      case 'security':
        return '🔒';
      default:
        return '📌';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'payment':
        return 'text-green-400 bg-green-400/10 border-green-500/20';
      case 'auth':
        return 'text-blue-400 bg-blue-400/10 border-blue-500/20';
      case 'profile':
        return 'text-purple-400 bg-purple-400/10 border-purple-500/20';
      case 'appeal':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20';
      case 'document':
        return 'text-cyan-400 bg-cyan-400/10 border-cyan-500/20';
      case 'security':
        return 'text-red-400 bg-red-400/10 border-red-500/20';
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Activity Log</h2>
        <p className="text-slate-400">Track your account activities and actions</p>
      </div>

      {/* Filters Section */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search activities..." 
            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="relative">
           <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
           <select 
            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-400 focus:outline-none appearance-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
           >
             <option value="All">All Activity Types</option>
             <option value="payment">Payments</option>
             <option value="auth">Authentication</option>
             <option value="profile">Profile Updates</option>
             <option value="appeal">Appeals</option>
             <option value="document">Documents</option>
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
      </div>

      {/* Activity Timeline */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white">Recent Activities</h3>
        </div>

        <div className="divide-y divide-slate-800">
          {filteredActivities.map((activity, index) => (
            <div key={activity.id} className="p-6 hover:bg-slate-800/50 transition-colors">
              <div className="flex items-start gap-4">
                {/* Timeline Icon */}
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                </div>

                {/* Activity Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-white mb-1">{activity.action}</h4>
                      <p className="text-sm text-slate-400">{activity.description}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 flex-shrink-0">
                      <Clock className="w-4 h-4" />
                      <span>{format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <div className="text-sm text-slate-400 mb-2">Total Activities</div>
          <div className="text-2xl font-bold text-white">{ACTIVITY_LOG.length}</div>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <div className="text-sm text-slate-400 mb-2">Payments Made</div>
          <div className="text-2xl font-bold text-green-400">
            {ACTIVITY_LOG.filter(a => a.type === 'payment').length}
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <div className="text-sm text-slate-400 mb-2">Last Login</div>
          <div className="text-lg font-semibold text-blue-400">
            {format(new Date(ACTIVITY_LOG.find(a => a.type === 'auth')?.timestamp || new Date()), 'MMM dd, HH:mm')}
          </div>
        </div>
      </div>
    </div>
  );
}
