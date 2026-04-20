import React from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend 
} from 'recharts';
import { Activity, Target, Zap, AlertOctagon } from 'lucide-react';

const PR_DATA = [
  { recall: 0.1, precision: 1.0 },
  { recall: 0.2, precision: 0.99 },
  { recall: 0.3, precision: 0.98 },
  { recall: 0.4, precision: 0.97 },
  { recall: 0.5, precision: 0.95 },
  { recall: 0.6, precision: 0.92 },
  { recall: 0.7, precision: 0.88 },
  { recall: 0.8, precision: 0.82 },
  { recall: 0.9, precision: 0.70 },
  { recall: 1.0, precision: 0.50 },
];

const CLASS_PERFORMANCE = [
  { name: 'No Helmet', precision: 0.94, recall: 0.92, f1: 0.93 },
  { name: 'No Plate', precision: 0.91, recall: 0.88, f1: 0.89 },
  { name: 'Overloading', precision: 0.85, recall: 0.82, f1: 0.83 },
  { name: 'Motorcycle', precision: 0.98, recall: 0.97, f1: 0.97 },
];

export function ModelMetrics() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Model Metrics</h2>
        <p className="text-slate-400">YOLOv11 Performance Analytics</p>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="mAP @ 0.5" 
          value="94.5%" 
          change="+1.2%" 
          icon={Target} 
          color="text-blue-500" 
          bg="bg-blue-500/10"
        />
        <MetricCard 
          title="Precision" 
          value="0.92" 
          change="+0.5%" 
          icon={Zap} 
          color="text-yellow-500" 
          bg="bg-yellow-500/10"
        />
        <MetricCard 
          title="Recall" 
          value="0.89" 
          change="-0.2%" 
          icon={Activity} 
          color="text-green-500" 
          bg="bg-green-500/10"
        />
        <MetricCard 
          title="F1 Score" 
          value="0.90" 
          change="+0.1%" 
          icon={AlertOctagon} 
          color="text-purple-500" 
          bg="bg-purple-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Precision-Recall Curve */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="font-semibold text-slate-900 mb-6">Precision-Recall Curve</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PR_DATA}>
                <defs>
                  <linearGradient id="colorPr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="recall" 
                  stroke="#64748b" 
                  label={{ value: 'Recall', position: 'insideBottomRight', offset: -5, fill: '#64748b' }} 
                />
                <YAxis 
                  stroke="#64748b" 
                  domain={[0, 1]} 
                  label={{ value: 'Precision', angle: -90, position: 'insideLeft', fill: '#64748b' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                />
                <Area type="monotone" dataKey="precision" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Per Class Performance */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="font-semibold text-slate-900 mb-6">Class Performance (F1 Score)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={CLASS_PERFORMANCE}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" domain={[0, 1]} stroke="#64748b" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} />
                <Tooltip 
                  cursor={{fill: '#1e293b'}}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                />
                <Legend />
                <Bar dataKey="precision" name="Precision" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="recall" name="Recall" fill="#eab308" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confusion Matrix (Simulated) */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 lg:col-span-2">
           <h3 className="font-semibold text-slate-900 mb-6">Confusion Matrix</h3>
           <div className="overflow-x-auto">
             <table className="w-full text-center">
               <thead>
                 <tr>
                   <th className="p-2"></th>
                   <th className="p-2 text-slate-400 font-normal text-sm">Pred: No Helmet</th>
                   <th className="p-2 text-slate-400 font-normal text-sm">Pred: No Plate</th>
                   <th className="p-2 text-slate-400 font-normal text-sm">Pred: Overload</th>
                   <th className="p-2 text-slate-400 font-normal text-sm">Pred: Normal</th>
                 </tr>
               </thead>
               <tbody className="text-sm">
                 <tr>
                   <th className="p-2 text-slate-400 font-normal text-right">Actual: No Helmet</th>
                   <td className="p-4 bg-blue-600/90 text-white font-bold rounded m-1">452</td>
                   <td className="p-4 bg-slate-800/50 text-slate-400 rounded m-1">12</td>
                   <td className="p-4 bg-slate-800/50 text-slate-400 rounded m-1">5</td>
                   <td className="p-4 bg-slate-800/80 text-white rounded m-1 border border-red-500/50">24</td>
                 </tr>
                 <tr>
                   <th className="p-2 text-slate-400 font-normal text-right">Actual: No Plate</th>
                   <td className="p-4 bg-slate-800/50 text-slate-400 rounded m-1">8</td>
                   <td className="p-4 bg-blue-600/80 text-white font-bold rounded m-1">385</td>
                   <td className="p-4 bg-slate-800/50 text-slate-400 rounded m-1">3</td>
                   <td className="p-4 bg-slate-800/80 text-white rounded m-1 border border-red-500/50">35</td>
                 </tr>
                 <tr>
                   <th className="p-2 text-slate-400 font-normal text-right">Actual: Overload</th>
                   <td className="p-4 bg-slate-800/50 text-slate-400 rounded m-1">4</td>
                   <td className="p-4 bg-slate-800/50 text-slate-400 rounded m-1">2</td>
                   <td className="p-4 bg-blue-600/70 text-white font-bold rounded m-1">156</td>
                   <td className="p-4 bg-slate-800/80 text-white rounded m-1 border border-red-500/50">18</td>
                 </tr>
                 <tr>
                   <th className="p-2 text-slate-400 font-normal text-right">Actual: Normal</th>
                   <td className="p-4 bg-slate-800/80 text-white rounded m-1 border border-red-500/50">15</td>
                   <td className="p-4 bg-slate-800/80 text-white rounded m-1 border border-red-500/50">22</td>
                   <td className="p-4 bg-slate-800/80 text-white rounded m-1 border border-red-500/50">8</td>
                   <td className="p-4 bg-blue-600 text-white font-bold rounded m-1">1250</td>
                 </tr>
               </tbody>
             </table>
           </div>
           <p className="text-xs text-slate-500 mt-4 text-center">
             Diagonal represents correct predictions. Off-diagonal represents errors.
             <span className="ml-2 inline-block w-3 h-3 bg-red-500/20 border border-red-500/50 rounded-sm align-middle mr-1"></span>
             Highlighted cells indicate False Negatives/Positives.
           </p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, change, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
          <div className="flex items-center text-sm mt-1 text-green-500">
            <span>{change}</span>
            <span className="text-slate-500 ml-1">vs last version</span>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${bg}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}