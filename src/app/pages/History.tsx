import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { showToast } from '@/app/utils/toast';

const HISTORY_DATA = Array.from({ length: 15 }).map((_, i) => ({
  id: i + 1,
  date: '2023-10-25',
  time: `14:${10 + i}:00`,
  location: i % 2 === 0 ? 'Gate 1 Cam' : 'Main St Cam',
  violation: i % 3 === 0 ? 'No Helmet' : i % 3 === 1 ? 'No Plate' : 'Overloading',
  status: i % 4 === 0 ? 'Reported' : 'Pending',
  image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=200'
}));

export function History() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [violationFilter, setViolationFilter] = useState('All Violations');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter data based on search and violation type
  const filteredData = HISTORY_DATA.filter((item) => {
    const matchesSearch = searchTerm === '' || 
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.id).padStart(5, '0').includes(searchTerm);
    
    const matchesViolation = violationFilter === 'All Violations' || 
      item.violation === violationFilter;
    
    return matchesSearch && matchesViolation;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handleExportCSV = () => {
    const headers = ['ID', 'Violation Type', 'Location', 'Date', 'Time', 'Status'];
    const csvData = filteredData.map(row => [
      `#${String(row.id).padStart(5, '0')}`,
      row.violation,
      row.location,
      row.date,
      row.time,
      row.status
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `violation-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast.success('CSV file exported successfully');
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleViewDetails = (id: number) => {
    navigate(`/incidents/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Violation History</h2>
          <p className="text-slate-400">Search and filter past detection records</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={handleExportCSV}
             className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors">
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
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
            }}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-600 transition-all cursor-pointer"
            value={violationFilter}
            onChange={(e) => {
              setViolationFilter(e.target.value);
              setCurrentPage(1); // Reset to first page when filtering
            }}
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
              {currentData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-500">#{String(row.id).padStart(5, '0')}</td>
                  <td className="px-6 py-4">
                    <div className="w-16 h-10 bg-slate-800 rounded overflow-hidden">
                      <img src={row.image} alt="Evidence" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      row.violation === 'No Helmet' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                      row.violation === 'No Plate' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {row.violation}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{row.location}</td>
                  <td className="px-6 py-4 text-slate-300">
                    <div>{row.date}</div>
                    <div className="text-xs text-slate-500">{row.time}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                      row.status === 'Reported' ? 'text-green-400' : 'text-slate-400'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-400 hover:text-blue-300 font-medium" onClick={() => handleViewDetails(row.id)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-800 flex justify-between items-center">
          <div className="text-xs text-slate-500">
            Showing {filteredData.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} results
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-slate-500">Page {currentPage} of {totalPages || 1}</span>
            <button 
              className={`p-2 rounded transition-colors ${
                currentPage === 1 
                  ? 'text-slate-600 cursor-not-allowed' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              className={`p-2 rounded transition-colors ${
                currentPage === totalPages || totalPages === 0
                  ? 'text-slate-600 cursor-not-allowed' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
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