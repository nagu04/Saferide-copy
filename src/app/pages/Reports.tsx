import React, { useState, useEffect } from 'react';
import { FileDown, FileText, Calendar, Filter, Download, Trash2 } from 'lucide-react';
import { showToast } from '@/app/utils/toast';
// Complete violation data generator

export function Reports() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [dateRange, setDateRange] = useState('This Month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [reportType, setReportType] = useState('Violation Summary (Daily)');
  const [format, setFormat] = useState('pdf');
  type Report = {
    id: string;
    name: string;
    user: string;
    date: string;
    size: string;
  };

  const [recentReports, setRecentReports] = useState<Report[]>([]);
  
  useEffect(() => {
    let isMounted = true;

    const fetchReports = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        showToast.error("Session expired. Please login again.");
        return;
      }
      const res = await fetch("https://saferide-l724.onrender.com/api/reports/recent", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (isMounted) {
        setRecentReports(data.reports || []);
      }
    };

    fetchReports(); // initial load

    const interval = setInterval(fetchReports, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Calculate actual dates based on selected range
  const getDateRange = () => {
    const today = new Date();
    let start: Date;
    let end: Date = new Date(today);
    
    switch (dateRange) {
      case 'This Month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'Last Month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'Last 3 Months':
        start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        end = new Date(today);
        break;
      case 'Last 6 Months':
        start = new Date(today.getFullYear(), today.getMonth() - 6, 1);
        end = new Date(today);
        break;
      case 'This Year':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today);
        break;
      case 'Last Year':
        start = new Date(today.getFullYear() - 1, 0, 1);
        end = new Date(today.getFullYear() - 1, 11, 31);
        break;
      case 'Custom Range':
        if (!customStartDate || !customEndDate) {
          return null;
        }
        start = new Date(customStartDate);
        end = new Date(customEndDate);
        break;
      default:
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today);
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const handleGenerate = async () => {
    const dates = getDateRange();

    if (!dates) {
      showToast.error('Please select both start and end dates');
      return;
    }

    setIsGenerating(true);

    try {
      const token = localStorage.getItem("access_token");

      const res = await fetch(
        `https://saferide-l724.onrender.com/api/reports/generate?start=${dates.start}&end=${dates.end}&format=${format}&report_type=${encodeURIComponent(reportType)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const blob = await res.blob();

      const filename = `Report_${dates.start}_${dates.end}.${format}`;
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();

      window.URL.revokeObjectURL(url);

      // 🔥 REFRESH RECENT REPORTS FROM BACKEND
      const resRecent = await fetch("https://saferide-l724.onrender.com/api/reports/recent", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await resRecent.json();
      setRecentReports(data.reports || []);

      showToast.success("Report generated");

    } catch (err) {
      showToast.error("Failed to generate report");
    }

    setIsGenerating(false);
  };

  const handleDownloadReport = async (report: Report) => {
    const token = localStorage.getItem("access_token");

    const res = await fetch(
      `https://saferide-l724.onrender.com/api/reports/download/${report.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = report.name;
    a.click();

    window.URL.revokeObjectURL(url);

    showToast.success(`Downloading ${report.name}`);
  };

  const handleDeleteReport = async (reportId: string) => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`https://saferide-l724.onrender.com/api/reports/${reportId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setRecentReports(prev => prev.filter(r => r.id !== reportId));
      showToast.success("Report deleted");
    } else {
      showToast.error("Failed to delete report");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Reports & Export</h2>
        <p className="text-slate-400">Generate compliance reports and data exports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-6">
           <h3 className="font-semibold text-white flex items-center gap-2">
             <Filter className="w-5 h-5 text-blue-500" />
             Report Configuration
           </h3>
           
           <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Date Range</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>Last 3 Months</option>
                  <option>Last 6 Months</option>
                  <option>This Year</option>
                  <option>Last Year</option>
                  <option>Custom Range</option>
                </select>
              </div>

              {dateRange === 'Custom Range' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Custom Date Range</label>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="relative">
                       <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                       <input 
                         type="date" 
                         className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                         value={customStartDate} 
                         onChange={(e) => setCustomStartDate(e.target.value)} 
                         placeholder="Start Date"
                       />
                     </div>
                     <div className="relative">
                       <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                       <input 
                         type="date" 
                         className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                         value={customEndDate} 
                         onChange={(e) => setCustomEndDate(e.target.value)} 
                         placeholder="End Date"
                       />
                     </div>
                  </div>
                </div>
              )}

              <div>
                 <label className="block text-sm font-medium text-slate-300 mb-2">Report Type</label>
                 <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200" value={reportType} onChange={(e) => setReportType(e.target.value)}>
                    <option>Violation Summary (Daily)</option>
                    <option>Violation Summary (Monthly)</option>
                    <option>Metrics & Analytics Data</option>
                    <option>Enforcement Performance</option>
                    <option>System Uptime & Health</option>
                 </select>
              </div>

              <div>
                 <label className="block text-sm font-medium text-slate-300 mb-2">Format</label>
                 <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="format" className="text-blue-600 focus:ring-blue-500" value="pdf" checked={format === 'pdf'} onChange={(e) => setFormat(e.target.value)} />
                      <span className="text-slate-300">PDF Document</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="format" className="text-blue-600 focus:ring-blue-500" value="xlsx" checked={format === 'xlsx'} onChange={(e) => setFormat(e.target.value)} />
                      <span className="text-slate-300">Excel Spreadsheet (XLSX)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="format" className="text-blue-600 focus:ring-blue-500" value="csv" checked={format === 'csv'} onChange={(e) => setFormat(e.target.value)} />
                      <span className="text-slate-300">CSV Raw Data</span>
                    </label>
                 </div>
              </div>
           </div>

           <div className="pt-4 border-t border-slate-800">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <FileDown className="w-5 h-5" />
                    Generate & Download
                  </>
                )}
              </button>
           </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
           <h3 className="font-semibold text-white mb-4">Recent Generated Reports</h3>
           <div className="space-y-3">
              {recentReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                   <div className="flex items-center gap-3">
                      <div className="bg-red-500/10 p-2 rounded">
                        <FileText className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-200">{report.name}</div>
                        <div className="text-xs text-slate-500">Generated by {report.user} • {report.size} • {report.date ? new Date(report.date).toLocaleString() : "Unknown date"}</div>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                     <button className="text-blue-400 hover:text-blue-300 text-sm font-medium" onClick={() => handleDownloadReport(report)}>
                       <Download className="w-4 h-4" />
                     </button>
                     <button className="text-red-400 hover:text-red-300 text-sm font-medium" onClick={() => handleDeleteReport(report.id)}>
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}