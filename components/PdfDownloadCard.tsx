
import React, { useState } from 'react';
import { PdfConfig } from '../types';
import { generatePdfReport } from '../services/pdfService';
import { FileDown, CheckCircle, Loader2 } from 'lucide-react';

interface PdfDownloadCardProps {
  config: PdfConfig;
}

const PdfDownloadCard: React.FC<PdfDownloadCardProps> = ({ config }) => {
  const [isGenerated, setIsGenerated] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    // Slight delay to allow UI to update and simulate generation time for UX
    setTimeout(() => {
      try {
        generatePdfReport(config);
        setIsGenerated(true);
      } catch (e) {
        console.error("PDF Generation failed", e);
      } finally {
        setIsDownloading(false);
      }
    }, 800);
  };

  return (
    <div className="w-full max-w-sm my-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
          <FileDown size={18} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-800">PDF Report Ready</h4>
          <p className="text-xs text-slate-500">{config.filename}.pdf</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="space-y-3 mb-4">
           <div>
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Report Title</span>
              <p className="text-sm font-medium text-slate-700">{config.title}</p>
           </div>
           {config.period && (
             <div>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Period</span>
                <p className="text-sm text-slate-700">{config.period}</p>
             </div>
           )}
           {config.summary && (
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                 {Object.entries(config.summary).slice(0, 4).map(([key, value]) => (
                    <div key={key}>
                       <span className="text-[10px] text-slate-400 block">{key}</span>
                       <span className="text-xs font-bold text-slate-700">{value}</span>
                    </div>
                 ))}
              </div>
           )}
        </div>

        <button 
          onClick={handleDownload}
          disabled={isDownloading}
          className={`w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
             isGenerated 
             ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
             : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
          }`}
        >
          {isDownloading ? (
            <>
              <Loader2 className="animate-spin" size={16} /> Generating PDF...
            </>
          ) : isGenerated ? (
            <>
              <CheckCircle size={16} /> Downloaded Again
            </>
          ) : (
            <>
              <FileDown size={16} /> Download Report
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PdfDownloadCard;
