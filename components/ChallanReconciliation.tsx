
import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle, AlertOctagon, Download, RefreshCw, Filter, Search, XCircle, FileText } from 'lucide-react';
import { Contractor, ReconciliationRecord, ReconciliationSummary } from '../types';
import { parseChallanFile, runReconciliation } from '../services/reconciliationService';

interface Props {
  contractors: Contractor[];
}

const ChallanReconciliation: React.FC<Props> = ({ contractors }) => {
  const [selectedMonth, setSelectedMonth] = useState('2025-10');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [records, setRecords] = useState<ReconciliationRecord[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const processReconciliation = async () => {
    if (!uploadedFile) return;
    setIsUploading(true);
    
    try {
      // 1. Parse File
      const allWorkers = contractors.flatMap(c => c.workers);
      const parsedRows = await parseChallanFile(uploadedFile, allWorkers);
      
      // 2. Run Logic
      const result = runReconciliation(selectedMonth, parsedRows, contractors);
      
      setRecords(result.records);
      setSummary(result.summary);
    } catch (error) {
      console.error("Reconciliation failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleExport = () => {
    if (records.length === 0) return;

    // Define CSV Headers
    const headers = [
      "UAN",
      "Employee Name",
      "Category",
      "Days Present",
      "System Wage",
      "System PF",
      "Challan Wage",
      "Challan PF",
      "Difference",
      "Status",
      "Remarks"
    ];

    // Convert records to CSV rows
    const csvRows = records.map(r => [
      r.uan,
      `"${r.employeeName}"`, // Quote name to handle commas
      r.category,
      r.daysPresent,
      r.calculatedWage,
      r.calculatedPF,
      r.challanWage,
      r.challanPF,
      r.difference,
      r.status,
      `"${r.remarks || ''}"`
    ].join(","));

    // Combine headers and rows
    const csvContent = [headers.join(","), ...csvRows].join("\n");

    // Create Blob and Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PF_Reconciliation_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || r.uan.includes(searchTerm);
    const matchesFilter = filterStatus === 'ALL' || r.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'MATCH':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle size={10} /> Match</span>;
      case 'MISMATCH':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100"><AlertTriangle size={10} /> Mismatch</span>;
      case 'NOT_FOUND_IN_DB':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100"><AlertOctagon size={10} /> Not In DB</span>;
      case 'NOT_FOUND_IN_CHALLAN':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200"><XCircle size={10} /> Missing in Challan</span>;
      default:
        return null;
    }
  };

  const TableHeader = ({ children, align = 'left' }: { children: React.ReactNode, align?: 'left'|'right'|'center' }) => (
     <th className={`px-6 py-3 border-b border-slate-200 bg-slate-50 text-${align} text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0`}>
        {children}
     </th>
  );

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-normal text-slate-800">Challan Reconciliation</h1>
          <p className="text-sm text-slate-500 mt-1">Validate PF Challans against System Wage Calculations</p>
        </div>
        <div className="flex gap-3">
           <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
           />
           {summary && (
              <button 
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
              >
                 <Download size={16} /> Export Report
              </button>
           )}
        </div>
      </div>

      {/* Upload Section */}
      {!summary && (
        <div className="bg-white p-10 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-center hover:border-blue-400 transition-colors">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <UploadCloud size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-800">Upload PF Challan File</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-md">
               Upload the monthly ECR / Challan file (CSV, Excel, PDF). We will parse it and compare against the employee attendance for {selectedMonth}.
            </p>
            
            <input 
               type="file" 
               ref={fileInputRef}
               className="hidden" 
               accept=".csv,.xlsx,.pdf" 
               onChange={handleFileChange}
            />
            
            <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 transition-colors"
                >
                   {uploadedFile ? 'Change File' : 'Select File'}
                </button>
                {uploadedFile && (
                   <button 
                      onClick={processReconciliation}
                      disabled={isUploading}
                      className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-md shadow-sm hover:bg-emerald-700 transition-colors flex items-center gap-2"
                   >
                      {isUploading ? <RefreshCw className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />}
                      {isUploading ? 'Processing...' : 'Run Reconciliation'}
                   </button>
                )}
            </div>
            {uploadedFile && (
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1 rounded border border-slate-200">
                    <FileText size={14} /> {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(2)} KB)
                </div>
            )}
        </div>
      )}

      {/* Results Dashboard */}
      {summary && (
        <div className="flex flex-col gap-6 flex-1 min-h-0">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Records</p>
                    <div className="text-2xl font-bold text-slate-800 mt-1">{summary.totalRecords}</div>
                    <div className="flex justify-between mt-3 text-xs">
                       <span className="text-slate-500">In Challan: {summary.totalRecords - summary.notFoundInChallanCount}</span>
                       <span className="text-slate-500">In System: {summary.totalRecords - summary.notFoundInDbCount}</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Match Status</p>
                    <div className="text-2xl font-bold text-emerald-600 mt-1">{summary.matchedCount} <span className="text-sm font-normal text-slate-500">Matches</span></div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${(summary.matchedCount / summary.totalRecords) * 100}%` }}></div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Discrepancies</p>
                    <div className="text-2xl font-bold text-amber-600 mt-1">{summary.mismatchCount} <span className="text-sm font-normal text-slate-500">Mismatches</span></div>
                    <p className="text-xs text-red-500 mt-3 font-medium">
                       {summary.notFoundInDbCount} Not in DB • {summary.notFoundInChallanCount} Missing in Challan
                    </p>
                </div>
                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Difference</p>
                    <div className={`text-2xl font-bold mt-1 ${summary.netDifference === 0 ? 'text-slate-800' : 'text-red-600'}`}>
                       {summary.netDifference > 0 ? '+' : ''}₹{summary.netDifference.toLocaleString()}
                    </div>
                    <div className="flex justify-between mt-3 text-xs">
                        <span className="text-slate-500">Sys: ₹{summary.totalCalculatedPF.toLocaleString()}</span>
                        <span className="text-slate-500">File: ₹{summary.totalChallanPF.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Filter & Table */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-lg flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-800">Detailed Reconciliation</h3>
                        <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">{filteredRecords.length}</span>
                    </div>
                    <div className="flex gap-3">
                         <div className="relative">
                             <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                             <input 
                               type="text" 
                               placeholder="Search UAN or Name..." 
                               value={searchTerm}
                               onChange={(e) => setSearchTerm(e.target.value)}
                               className="pl-8 pr-3 py-1.5 rounded-md border border-slate-300 text-sm w-48 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                             />
                         </div>
                         <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-md px-1 p-0.5">
                             {['ALL', 'MISMATCH', 'NOT_FOUND_IN_DB', 'NOT_FOUND_IN_CHALLAN'].map(status => (
                                 <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filterStatus === status ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                                 >
                                    {status === 'ALL' ? 'All' : status.replace(/_/g, ' ')}
                                 </button>
                             ))}
                         </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <TableHeader>UAN</TableHeader>
                                <TableHeader>Employee Name</TableHeader>
                                <TableHeader>Days Present</TableHeader>
                                <TableHeader align="right">System Wage</TableHeader>
                                <TableHeader align="right">System PF</TableHeader>
                                <TableHeader align="right">Challan Wage</TableHeader>
                                <TableHeader align="right">Challan PF</TableHeader>
                                <TableHeader align="right">Diff</TableHeader>
                                <TableHeader align="center">Status</TableHeader>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRecords.map((row) => (
                                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-6 py-3 text-sm font-mono text-slate-600">{row.uan}</td>
                                    <td className="px-6 py-3 text-sm font-medium text-slate-800">{row.employeeName}</td>
                                    <td className="px-6 py-3 text-sm text-slate-600">{row.daysPresent}</td>
                                    <td className="px-6 py-3 text-sm text-right font-mono text-slate-600">₹{row.calculatedWage.toLocaleString()}</td>
                                    <td className="px-6 py-3 text-sm text-right font-mono text-blue-700 bg-blue-50/30">₹{row.calculatedPF}</td>
                                    <td className="px-6 py-3 text-sm text-right font-mono text-slate-600">₹{row.challanWage.toLocaleString()}</td>
                                    <td className="px-6 py-3 text-sm text-right font-mono text-slate-800">₹{row.challanPF}</td>
                                    <td className={`px-6 py-3 text-sm text-right font-mono font-bold ${row.difference === 0 ? 'text-slate-300' : 'text-red-600'}`}>
                                        {row.difference === 0 ? '-' : `${row.difference > 0 ? '+' : ''}${row.difference}`}
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <StatusBadge status={row.status} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="flex justify-end">
                <button 
                  onClick={() => { setSummary(null); setUploadedFile(null); setRecords([]); }} 
                  className="text-sm text-slate-500 hover:text-slate-800 underline"
                >
                    Reset & Upload New File
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default ChallanReconciliation;
