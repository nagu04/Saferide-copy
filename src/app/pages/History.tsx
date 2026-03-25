import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { showToast } from '@/app/utils/toast';
import { api } from '@/app/services/api';
import type { Violation } from '@/app/types';

export function History() {
  const navigate = useNavigate();
  const [historyData, setHistoryData] = useState<Violation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [violationFilter, setViolationFilter] = useState('All Violations');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch history from backend
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const recent = await api.dashboard.getRecentViolations(50); // fetch last 50
        setHistoryData(recent);
      } catch (e) {
        console.error(e);
        showToast.error('Failed to load violation history');
      }
    };
    loadHistory();
  }, []);

  // Filter data based on search and violation type
  const filteredData = historyData.filter(item => {
    const matchesSearch =
      searchTerm === '' ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toString().includes(searchTerm);
    
    const firstType = item.detections[0]?.type
      ?.replace('_', ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    const matchesViolation =
      violationFilter === 'All Violations' || firstType === violationFilter;
    
    return matchesSearch && matchesViolation;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handleExportCSV = () => {
    const headers = ['ID', 'Violation Type', 'Location', 'Date', 'Time', 'Status'];
    const csvData = filteredData.map(row => {
      const firstDet = row.detections[0];
      const date = new Date(row.timestamp);
      return [
        `#${row.id}`,
        firstDet?.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown',
        row.location,
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        row.status
      ];
    });

    const csvContent = [headers.join(','), ...csvData.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `violation-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast.success('CSV file exported successfully');
  };

  const handleNextPage = () => setCurrentPage(p => Math.min(p + 1, totalPages));
  const handlePrevPage = () => setCurrentPage(p => Math.max(p - 1, 1));
  const handleViewDetails = (id: number) => navigate(`/incidents/${id}`);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Violation History</h2>
          <p className="text-slate-400">Search and filter past detection records</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by ID or Location..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-600 transition-all cursor-pointer"
            value={violationFilter}
            onChange={e => { setViolationFilter(e.target.value); setCurrentPage(1); }}
          >
            <option>All Violations</option>
            <option>No Helmet</option>
            <option>No Plate</option>
            <option>Overloading</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 text-slate-200 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Snapshot</th>
                <th className="px-6 py-4">Violation Type</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {currentData.map(row => {
                const firstDet = row.detections[0];
                const date = new Date(row.timestamp);
                const violationType = firstDet?.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
                const imageUrl = firstDet?.image_url || 'https://via.placeholder.com/200';
                return (
                  <tr key={row.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-500">#{row.id}</td>
                    <td className="px-6 py-4">
                      <div className="w-16 h-10 bg-slate-800 rounded overflow-hidden">
                        <img src={imageUrl} alt="Evidence" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        violationType === 'No Helmet' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        violationType === 'No Plate' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {violationType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{row.location}</td>
                    <td className="px-6 py-4 text-slate-300">
                      <div>{date.toLocaleDateString()}</div>
                      <div className="text-xs text-slate-500">{date.toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${row.status === 'Reported' ? 'text-green-400' : 'text-slate-400'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-blue-400 hover:text-blue-300 font-medium" onClick={() => handleViewDetails(row.id)}>View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-800 flex justify-between items-center">
          <div className="text-xs text-slate-500">
            Showing {filteredData.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} results
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-slate-500">Page {currentPage} of {totalPages || 1}</span>
            <button
              className={`p-2 rounded transition-colors ${currentPage === 1 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              className={`p-2 rounded transition-colors ${currentPage === totalPages || totalPages === 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}