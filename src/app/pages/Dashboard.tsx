import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TriangleAlert, HardHat, Scale, FileWarning, Clock, AlertCircle, CameraOff } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'motion/react';
import { api } from '@/app/services/api';
import { useWebSocket } from '@/app/services/websocket';
import { showToast } from '@/app/utils/toast';
import type { DashboardStats, ViolationTrendData, Violation, WebSocketMessage } from '@/app/types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'live' | 'analytics'>('live');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trendData, setTrendData] = useState<ViolationTrendData[]>([]);
  const [recentViolations, setRecentViolations] = useState<Violation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  

  // WebSocket connection for real-time updates
  const { isConnected } = useWebSocket((message: WebSocketMessage) => {
    if (message.type === 'new_violation') {
      const newViolation = message.data as Violation;

      // 1. Update the list of recent violations
      setRecentViolations(prev => {
        if (prev.find(v => v.id === newViolation.id)) return prev;
        return [newViolation, ...prev.slice(0, 19)];
      });

      // 2. Show toast notification (clickable to navigate)
      showToast.violationAlert(
        newViolation.detections[0]?.type || 'Unknown',
        newViolation.location,
        newViolation.detections[0]?.plate_number || '',
        () => navigate(`/incidents/${newViolation.id}`) // navigate on click
      );

      // 3. Do NOT auto-navigate immediately (removed)
      // navigate(`/incidents/${newViolation.id}`);

      // 4. Refresh stats if needed
      setStats(prev => prev ? {
        ...prev,
        helmet_violations: prev.helmet_violations + (newViolation.detections[0]?.type === 'no_helmet' ? 1 : 0),
        plate_violations: prev.plate_violations + (newViolation.detections[0]?.type === 'no_plate' ? 1 : 0),
        overloading_violations: prev.overloading_violations + (newViolation.detections[0]?.type === 'overloading' ? 1 : 0),
      } : prev);
    }
    if (message.type === 'update_violation') {
      const updated = message.data as Violation;
      setRecentViolations(prev =>
        prev.map(v => (v.id === updated.id ? { ...v, ...updated } : v))
      );
    }

    if (message.type === 'stats_update') {
      loadStats();
    }

    if (message.type === 'system_status') {
      const status = message.data.status as 'online' | 'offline' | 'maintenance';
      showToast.systemStatus(status, message.data.message);
    }

    if (message.type === 'bulk_delete') {
      setRecentViolations(prev =>
        prev.filter(v => !message.ids.includes(v.id))
      );
    }

    if (message.type === 'delete_violation') {
      setRecentViolations(prev =>
        prev.filter(v => v.id !== message.id)
      );
    }
  }, true);

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        loadStats(),
        loadTrends(),
        loadRecentViolations()
      ]);
      setIsLoading(false);
    };

    init();

    const interval = setInterval(() => {
      loadStats();
      loadTrends();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const keepAlive = setInterval(() => {
      fetch("https://saferide-l724.onrender.com/health").catch(() => {});
    }, 4 * 60 * 1000); // every 4 minutes

    return () => clearInterval(keepAlive);
  }, []);

  const loadDashboardData = async () => {
    await Promise.all([loadStats(), loadTrends()]);
    setIsLoading(false);
  };

  const loadStats = async () => {
    try { setStats(await api.dashboard.getStats()); } 
    catch (e) { console.error(e); }
  };
  const loadTrends = async () => {
    try { setTrendData(await api.dashboard.getTrends(6)); } 
    catch (e) { console.error(e); }
  };
  const loadRecentViolations = async () => {
    try {
      setRecentViolations(await api.dashboard.getRecentViolations(10)); 
    } catch (e) {
      console.error(e);
    }
  };

  const chartData = trendData.map(item => ({
    time: new Date(item.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }),
    helmet: item.helmet_violations,
    plate: item.plate_violations,
    overload: item.overloading_violations,
  }));

  if (isLoading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-slate-400">Loading dashboard...</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
          <p className="text-slate-400">Real-time monitoring and violation reporting</p>
        </div>
        <div className="flex gap-2 items-center">
          {isConnected && (
            <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/10 px-3 py-1.5 rounded-lg border border-green-400/20">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live
            </div>
          )}
          <button onClick={() => setActiveTab('live')} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", activeTab === 'live' ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white")}>Live Feed</button>
          <button onClick={() => setActiveTab('analytics')} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", activeTab === 'analytics' ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white")}>Analytics</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <StatsCard title="Helmet Violations" value={stats?.helmet_violations.toString() || '0'} trend="+12%" trendUp={true} icon={HardHat} color="text-orange-500" bg="bg-orange-500/10" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <StatsCard title="Plate Violations" value={stats?.plate_violations.toString() || '0'} trend="-5%" trendUp={false} icon={FileWarning} color="text-yellow-500" bg="bg-yellow-500/10" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <StatsCard title="Overloading" value={stats?.overloading_violations.toString() || '0'} trend="+2%" trendUp={true} icon={Scale} color="text-red-500" bg="bg-red-500/10" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
          <StatsCard title="Active Cameras" value={`${stats?.active_cameras || 0}/${stats?.total_cameras || 0}`} subtitle="All systems operational" icon={AlertCircle} color="text-green-500" bg="bg-green-500/10" />
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-semibold text-white flex items-center gap-2">
                {activeTab === 'live' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Live Feed - Gate 1
                  </>
                ) : (
                  'Violation Trends (Last 6 Hours)'
                )}
              </h3>
              {activeTab === 'live' && (
                <span className="text-xs text-slate-400 font-mono">FPS: 24 | YOLOv11n</span>
              )}
            </div>

            <div className="aspect-video bg-black relative">
              {activeTab === 'live' ? <LiveFeed /> : (
                <div className="h-full w-full p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorHelmet" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} itemStyle={{ color: '#f1f5f9' }} />
                      <Area type="monotone" dataKey="helmet" stroke="#f97316" fillOpacity={1} fill="url(#colorHelmet)" name="Helmet" />
                      <Area type="monotone" dataKey="plate" stroke="#eab308" fillOpacity={1} fill="#eab308" name="Plate" />
                      <Area type="monotone" dataKey="overload" stroke="#ef4444" fillOpacity={1} fill="#ef4444" name="Overload" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 flex flex-col h-[500px]">
          <div className="p-4 border-b border-slate-800">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" /> Recent Detections
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {recentViolations.map(v => (
              <div key={v.id} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    {v.detections[0]?.type === 'no_helmet' && <HardHat className="w-4 h-4 text-orange-500" />}
                    {v.detections[0]?.type === 'no_plate' && <FileWarning className="w-4 h-4 text-yellow-500" />}
                    {v.detections[0]?.type === 'overloading' && <Scale className="w-4 h-4 text-red-500" />}
                    <span className="font-medium text-slate-200">
                      {v.detections[0]?.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">{new Date(v.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
                  <span>{v.location}</span>
                  <span className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">{Math.round((v.detections[0]?.confidence || 0) * 100)}% Conf.</span>
                </div>
              </div>
            ))}
            {recentViolations.length === 0 && <div className="text-center py-8 text-slate-500">No recent violations</div>}
            <div className="text-center py-4">
              <button onClick={() => navigate('/history')} className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200 hover:underline">View All History</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stats card
function StatsCard({ title, value, trend, trendUp, subtitle, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:shadow-lg hover:shadow-slate-950/50 cursor-pointer group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white">{value}</h3>
          {trend && <div className={cn("flex items-center text-sm mt-1", trendUp ? "text-green-500" : "text-red-500")}>
            <span>{trend}</span><span className="text-slate-500 ml-1">vs yesterday</span>
          </div>}
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={cn("p-3 rounded-lg transition-transform duration-300 group-hover:scale-110", bg)}>
          <Icon className={cn("w-6 h-6", color)} />
        </div>
      </div>
    </div>
  );
}



// --- LiveFeed Component ---
function LiveFeed() {
  const [retryKey, setRetryKey] = useState(0);
  const [status, setStatus] = useState<'connecting' | 'live' | 'offline'>('connecting');

  const retry = () => {
    setStatus('connecting');
    setRetryKey(prev => prev + 1);
  };

  // Auto retry when offline
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (status === 'offline') {
      timer = setTimeout(() => {
        setRetryKey(prev => prev + 1);
        setStatus('connecting');
      }, 5000);
    }

    return () => clearTimeout(timer);
  }, [status]);

  return (
    <div className="w-full h-full relative bg-black flex items-center justify-center">
      <img
        key={retryKey}
        src="https://polite-towns-stay.loca.lt/camera-feed/CAM-001"
        className="w-full h-full object-cover"
        onLoad={() => setStatus('live')}
        onError={() => setStatus('offline')}
      />

      {status !== 'live' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
          <CameraOff className="w-8 h-8 text-slate-500 mb-2" />
          <p className="text-slate-400 text-sm">
            {status === 'connecting' ? 'Connecting to camera...' : 'Camera Offline'}
          </p>
          <button
            onClick={retry}
            className="mt-3 px-3 py-1 bg-blue-600/20 text-blue-400 rounded-md text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {status === 'live' && (
        <div className="absolute top-4 right-4">
          <span className="bg-black/60 text-[10px] text-green-400 px-2 py-1 rounded border border-green-500/30">
            LIVE
          </span>
        </div>
      )}
    </div>
  );
}

export default LiveFeed;