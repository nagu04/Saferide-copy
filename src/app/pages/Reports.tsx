import React, { useState } from 'react';
import { FileDown, FileText, Calendar, Filter, Download, Trash2 } from 'lucide-react';
import { showToast } from '@/app/utils/toast';

// Sample recent reports data
const RECENT_REPORTS = [
  { id: 1, name: 'Violation_Summary_Oct2023.pdf', size: '2.4 MB', date: '2023-10-25 14:30', user: 'Admin', type: 'PDF' },
  { id: 2, name: 'Monthly_Report_Sep2023.xlsx', size: '1.8 MB', date: '2023-10-20 09:15', user: 'Admin', type: 'XLSX' },
  { id: 3, name: 'Enforcement_Performance_Q3.pdf', size: '3.2 MB', date: '2023-10-15 16:45', user: 'Supervisor', type: 'PDF' },
  { id: 4, name: 'Raw_Data_Export_Oct2023.csv', size: '856 KB', date: '2023-10-10 11:20', user: 'Admin', type: 'CSV' },
  { id: 5, name: 'System_Health_Report.pdf', size: '1.2 MB', date: '2023-10-05 08:00', user: 'System', type: 'PDF' },
];

// Complete violation data generator
const generateViolationData = (startDate: string, endDate: string) => {
  const violations = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  const violationTypes = ['No Helmet', 'No Plate', 'Overloading'];
  const locations = [
    'Quezon Ave & Timog Ave',
    'EDSA - Cubao',
    'Commonwealth Ave - Fairview',
    'C5 Road - Katipunan',
    'España Blvd',
    'Taft Ave - Vito Cruz',
    'Roxas Blvd - Baclaran'
  ];
  const statuses = ['Pending', 'Approved', 'Rejected'];
  
  // Generate violations across date range
  for (let i = 0; i < Math.min(days * 8, 200); i++) {
    const violationDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    const type = violationTypes[Math.floor(Math.random() * violationTypes.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const confidence = (85 + Math.random() * 14).toFixed(1);
    
    violations.push({
      id: `VIO-${String(i + 1).padStart(5, '0')}`,
      timestamp: violationDate.toISOString().replace('T', ' ').split('.')[0],
      type,
      location,
      plateNumber: type !== 'No Plate' ? `ABC${Math.floor(Math.random() * 9000 + 1000)}` : 'UNDETECTED',
      confidence: `${confidence}%`,
      status,
      reviewer: status !== 'Pending' ? `Officer ${Math.floor(Math.random() * 10 + 1)}` : 'N/A',
      reviewedAt: status !== 'Pending' ? new Date(violationDate.getTime() + Math.random() * 86400000).toISOString().replace('T', ' ').split('.')[0] : 'N/A',
      evidenceId: `IMG-${String(i + 1).padStart(6, '0')}.jpg`,
      modelVersion: 'YOLOv11-v1.2.3',
      speed: type === 'Overloading' ? `${Math.floor(Math.random() * 40 + 30)} km/h` : 'N/A',
      passengers: type === 'Overloading' ? Math.floor(Math.random() * 2 + 3) : type === 'No Helmet' ? Math.floor(Math.random() * 2 + 1) : 1
    });
  }
  
  return violations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Generate metrics data
const generateMetricsData = (startDate: string, endDate: string) => {
  const violations = generateViolationData(startDate, endDate);
  
  const totalViolations = violations.length;
  const byType = {
    'No Helmet': violations.filter(v => v.type === 'No Helmet').length,
    'No Plate': violations.filter(v => v.type === 'No Plate').length,
    'Overloading': violations.filter(v => v.type === 'Overloading').length
  };
  const byStatus = {
    'Pending': violations.filter(v => v.status === 'Pending').length,
    'Approved': violations.filter(v => v.status === 'Approved').length,
    'Rejected': violations.filter(v => v.status === 'Rejected').length
  };
  
  const avgConfidence = (violations.reduce((sum, v) => sum + parseFloat(v.confidence), 0) / violations.length).toFixed(1);
  const avgProcessingTime = '2.3 hours';
  const detectionAccuracy = '94.2%';
  const systemUptime = '99.7%';
  
  return {
    totalViolations,
    byType,
    byStatus,
    avgConfidence,
    avgProcessingTime,
    detectionAccuracy,
    systemUptime,
    violations
  };
};

export function Reports() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [dateRange, setDateRange] = useState('This Month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [reportType, setReportType] = useState('Violation Summary (Daily)');
  const [format, setFormat] = useState('pdf');
  const [recentReports, setRecentReports] = useState(RECENT_REPORTS);

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

  const handleGenerate = () => {
    // Get date range
    const dates = getDateRange();
    
    // Validation
    if (!dates) {
      showToast.error('Please select both start and end dates for custom range');
      return;
    }

    if (new Date(dates.start) > new Date(dates.end)) {
      showToast.error('Start date cannot be after end date');
      return;
    }

    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      
      // Generate filename based on selections
      const formatExt = format === 'pdf' ? 'txt' : format === 'xlsx' ? 'csv' : 'csv';
      const reportTypeName = reportType.replace(/[()]/g, '').replace(/\s+/g, '_');
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `${reportTypeName}_${dateStr}.${formatExt}`;
      
      // Create blob and download
      const content = generateReportContent(reportType, dates.start, dates.end, format);
      const blob = new Blob([content], { 
        type: 'text/plain;charset=utf-8'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      
      // Add to recent reports
      const newReport = {
        id: recentReports.length + 1,
        name: filename,
        size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`,
        date: new Date().toLocaleString('en-US', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        user: 'Admin',
        type: formatExt.toUpperCase()
      };
      
      setRecentReports([newReport, ...recentReports]);
      
      showToast.success(`Report generated successfully: ${filename}`);
    }, 2000);
  };

  const generateReportContent = (type: string, start: string, end: string, fmt: string) => {
    const metricsData = generateMetricsData(start, end);
    const violations = metricsData.violations;
    
    if (fmt === 'csv') {
      // Generate comprehensive CSV with all violation data
      let csv = `SafeRide - YOLOv11 Violation Detection System\n`;
      csv += `Report Type: ${type}\n`;
      csv += `Date Range: ${start} to ${end}\n`;
      csv += `Generated: ${new Date().toLocaleString()}\n`;
      csv += `Total Violations: ${metricsData.totalViolations}\n\n`;
      
      // Summary Statistics
      csv += `SUMMARY STATISTICS\n`;
      csv += `Metric,Value\n`;
      csv += `Total Violations,${metricsData.totalViolations}\n`;
      csv += `No Helmet Violations,${metricsData.byType['No Helmet']}\n`;
      csv += `No Plate Violations,${metricsData.byType['No Plate']}\n`;
      csv += `Overloading Violations,${metricsData.byType['Overloading']}\n`;
      csv += `Pending Review,${metricsData.byStatus['Pending']}\n`;
      csv += `Approved,${metricsData.byStatus['Approved']}\n`;
      csv += `Rejected,${metricsData.byStatus['Rejected']}\n`;
      csv += `Average Confidence,${metricsData.avgConfidence}%\n`;
      csv += `Detection Accuracy,${metricsData.detectionAccuracy}\n`;
      csv += `System Uptime,${metricsData.systemUptime}\n`;
      csv += `Avg Processing Time,${metricsData.avgProcessingTime}\n\n`;
      
      // Detailed violation records
      csv += `DETAILED VIOLATION RECORDS\n`;
      csv += `Violation ID,Timestamp,Type,Location,Plate Number,Confidence,Status,Reviewer,Reviewed At,Evidence ID,Model Version,Speed,Passengers\n`;
      violations.forEach(v => {
        csv += `${v.id},${v.timestamp},${v.type},${v.location},${v.plateNumber},${v.confidence},${v.status},${v.reviewer},${v.reviewedAt},${v.evidenceId},${v.modelVersion},${v.speed},${v.passengers}\n`;
      });
      
      return csv;
    } else if (fmt === 'xlsx') {
      // Generate Excel-formatted content (tab-separated for Excel compatibility)
      let xlsx = `SafeRide - YOLOv11 Violation Detection System\n`;
      xlsx += `Report Type\t${type}\n`;
      xlsx += `Date Range\t${start} to ${end}\n`;
      xlsx += `Generated\t${new Date().toLocaleString()}\n\n`;
      
      xlsx += `SUMMARY STATISTICS\n`;
      xlsx += `Metric\tValue\n`;
      xlsx += `Total Violations\t${metricsData.totalViolations}\n`;
      xlsx += `No Helmet Violations\t${metricsData.byType['No Helmet']}\n`;
      xlsx += `No Plate Violations\t${metricsData.byType['No Plate']}\n`;
      xlsx += `Overloading Violations\t${metricsData.byType['Overloading']}\n`;
      xlsx += `Pending Review\t${metricsData.byStatus['Pending']}\n`;
      xlsx += `Approved\t${metricsData.byStatus['Approved']}\n`;
      xlsx += `Rejected\t${metricsData.byStatus['Rejected']}\n`;
      xlsx += `Average Confidence\t${metricsData.avgConfidence}%\n`;
      xlsx += `Detection Accuracy\t${metricsData.detectionAccuracy}\n`;
      xlsx += `System Uptime\t${metricsData.systemUptime}\n`;
      xlsx += `Avg Processing Time\t${metricsData.avgProcessingTime}\n\n`;
      
      xlsx += `DETAILED VIOLATION RECORDS\n`;
      xlsx += `Violation ID\tTimestamp\tType\tLocation\tPlate Number\tConfidence\tStatus\tReviewer\tReviewed At\tEvidence ID\tModel Version\tSpeed\tPassengers\n`;
      violations.forEach(v => {
        xlsx += `${v.id}\t${v.timestamp}\t${v.type}\t${v.location}\t${v.plateNumber}\t${v.confidence}\t${v.status}\t${v.reviewer}\t${v.reviewedAt}\t${v.evidenceId}\t${v.modelVersion}\t${v.speed}\t${v.passengers}\n`;
      });
      
      return xlsx;
    } else {
      // Generate comprehensive PDF-formatted text
      let pdf = `SafeRide - YOLOv11 Violation Detection System\n`;
      pdf += `Real-Time Motorcycle Violation Detection Dashboard\n`;
      pdf += `${'='.repeat(80)}\n\n`;
      
      pdf += `REPORT INFORMATION\n`;
      pdf += `${'-'.repeat(80)}\n`;
      pdf += `Report Type: ${type}\n`;
      pdf += `Date Range: ${start} to ${end}\n`;
      pdf += `Generated: ${new Date().toLocaleString()}\n`;
      pdf += `Generated By: Admin\n\n`;
      
      pdf += `EXECUTIVE SUMMARY\n`;
      pdf += `${'-'.repeat(80)}\n`;
      pdf += `Total Violations Detected: ${metricsData.totalViolations}\n`;
      pdf += `Average Detection Confidence: ${metricsData.avgConfidence}%\n`;
      pdf += `System Detection Accuracy: ${metricsData.detectionAccuracy}\n`;
      pdf += `System Uptime: ${metricsData.systemUptime}\n`;
      pdf += `Average Processing Time: ${metricsData.avgProcessingTime}\n\n`;
      
      pdf += `VIOLATION BREAKDOWN BY TYPE\n`;
      pdf += `${'-'.repeat(80)}\n`;
      pdf += `No Helmet: ${metricsData.byType['No Helmet']} (${((metricsData.byType['No Helmet']/metricsData.totalViolations)*100).toFixed(1)}%)\n`;
      pdf += `No Plate: ${metricsData.byType['No Plate']} (${((metricsData.byType['No Plate']/metricsData.totalViolations)*100).toFixed(1)}%)\n`;
      pdf += `Overloading: ${metricsData.byType['Overloading']} (${((metricsData.byType['Overloading']/metricsData.totalViolations)*100).toFixed(1)}%)\n\n`;
      
      pdf += `VIOLATION STATUS\n`;
      pdf += `${'-'.repeat(80)}\n`;
      pdf += `Pending Review: ${metricsData.byStatus['Pending']} (${((metricsData.byStatus['Pending']/metricsData.totalViolations)*100).toFixed(1)}%)\n`;
      pdf += `Approved: ${metricsData.byStatus['Approved']} (${((metricsData.byStatus['Approved']/metricsData.totalViolations)*100).toFixed(1)}%)\n`;
      pdf += `Rejected: ${metricsData.byStatus['Rejected']} (${((metricsData.byStatus['Rejected']/metricsData.totalViolations)*100).toFixed(1)}%)\n\n`;
      
      pdf += `DETAILED VIOLATION RECORDS\n`;
      pdf += `${'-'.repeat(80)}\n\n`;
      violations.slice(0, 50).forEach((v, idx) => {
        pdf += `[${idx + 1}] ${v.id}\n`;
        pdf += `    Date/Time: ${v.timestamp}\n`;
        pdf += `    Type: ${v.type} | Confidence: ${v.confidence}\n`;
        pdf += `    Location: ${v.location}\n`;
        pdf += `    Plate: ${v.plateNumber} | Passengers: ${v.passengers}\n`;
        pdf += `    Status: ${v.status} | Reviewer: ${v.reviewer}\n`;
        pdf += `    Evidence: ${v.evidenceId} | Model: ${v.modelVersion}\n`;
        if (v.speed !== 'N/A') pdf += `    Speed: ${v.speed}\n`;
        pdf += `\n`;
      });
      
      if (violations.length > 50) {
        pdf += `... and ${violations.length - 50} more violations\n`;
        pdf += `(Download CSV or XLSX for complete records)\n`;
      }
      
      pdf += `\n${'='.repeat(80)}\n`;
      pdf += `End of Report\n`;
      
      return pdf;
    }
  };

  const handleDownloadReport = (report: typeof RECENT_REPORTS[0]) => {
    // Simulate downloading a previously generated report
    const content = `Sample report: ${report.name}\nGenerated on: ${report.date}\nBy: ${report.user}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = report.name;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast.success(`Downloading ${report.name}`);
  };

  const handleDeleteReport = (reportId: number) => {
    setRecentReports(recentReports.filter(r => r.id !== reportId));
    showToast.success('Report deleted');
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
                        <div className="text-xs text-slate-500">Generated by {report.user} • {report.size}</div>
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