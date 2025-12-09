
import React, { useState } from 'react';
import { Loader2, ExternalLink, ShieldAlert } from 'lucide-react';

const BGVVerification: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const BGV_URL = "https://equal.in/app/gateway/?instance_id=gateway.equal.15959643-9efe-47f6-938c-2b954e22299f&sdk_launch=true";

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-normal text-slate-800">Background Verification</h1>
          <p className="text-sm text-slate-500 mt-1">External BGV Portal Integration (Equal.in)</p>
        </div>
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                <ShieldAlert size={12} />
                Secure Gateway
            </div>
            <a 
                href={BGV_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-600 transition-colors"
                title="Open in new tab"
            >
                <ExternalLink size={16} />
            </a>
        </div>
      </div>

      {/* Main Content - Embedded Iframe */}
      <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10">
            <Loader2 size={40} className="text-blue-600 animate-spin mb-4" />
            <h3 className="text-slate-700 font-medium">Connecting to BGV Gateway...</h3>
            <p className="text-slate-400 text-xs mt-1">Establishing secure handshake with Equal.in</p>
          </div>
        )}
        
        <iframe
          src={BGV_URL}
          title="BGV Verification Portal"
          className="w-full h-full border-none"
          allow="camera; microphone; geolocation; fullscreen"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
};

export default BGVVerification;
