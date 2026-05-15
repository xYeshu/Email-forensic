import { useState } from 'react';
import { Paperclip, ChevronDown, ChevronUp, FileWarning, FileIcon, ShieldAlert, Download } from 'lucide-react';
import type { AnalyzedEmail, AttachmentInfo } from '../types';
import { formatBytes } from '../lib/utils';

export function AttachmentPanel({ email }: { email: AnalyzedEmail }) {
  const [expanded, setExpanded] = useState(true);

  if (email.attachments.length === 0) return null;

  return (
    <div className="bg-bg-card border border-border-color rounded-xl overflow-hidden shadow-lg mb-6">
      <div 
        className="px-6 py-4 flex items-center justify-between bg-bg-panel cursor-pointer border-b border-border-color"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <Paperclip className="w-6 h-6 text-accent-blue" />
          <h2 className="text-xl font-semibold text-text-primary">Attachments</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="px-3 py-1 bg-bg-dark rounded-full text-xs font-medium text-text-secondary border border-border-color">
            {email.attachments.length} Found
          </div>
          {expanded ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
        </div>
      </div>

      {expanded && (
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4">
            {email.attachments.map((att, i) => (
              <AttachmentCard key={i} attachment={att} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AttachmentCard({ attachment }: { attachment: AttachmentInfo }) {
  const handleDownload = () => {
    const blob = new Blob([attachment.content], { type: attachment.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`p-4 rounded-lg border ${attachment.isSuspicious ? 'bg-accent-red/5 border-accent-red/30' : 'bg-bg-panel border-border-color'} flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors hover:border-accent-blue/50`}>
      <div className="flex items-start space-x-4 w-full md:w-auto overflow-hidden">
        <div className={`p-3 rounded-lg shrink-0 ${attachment.isSuspicious ? 'bg-accent-red/10 text-accent-red' : 'bg-bg-dark text-text-muted'}`}>
          {attachment.isSuspicious ? <FileWarning className="w-6 h-6" /> : <FileIcon className="w-6 h-6" />}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-text-primary truncate" title={attachment.filename}>
            {attachment.filename}
          </h3>
          <div className="flex items-center space-x-3 mt-1 text-xs text-text-secondary">
            <span>{formatBytes(attachment.size)}</span>
            <span>•</span>
            <span className="truncate max-w-[200px]" title={attachment.mimeType}>{attachment.mimeType}</span>
          </div>
          <div className="mt-2 text-xs font-mono text-text-muted break-all">
            <span className="text-text-secondary mr-2">SHA256:</span>
            {attachment.hash}
          </div>
          
          {attachment.isSuspicious && attachment.suspiciousReasons.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {attachment.suspiciousReasons.map((reason, i) => (
                <span key={i} className="px-2 py-1 bg-accent-red/10 text-accent-red text-xs rounded border border-accent-red/20 flex items-center space-x-1">
                  <ShieldAlert className="w-3 h-3" />
                  <span>{reason}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <button 
        onClick={handleDownload}
        className="shrink-0 p-2 text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 rounded-lg transition-colors border border-transparent hover:border-accent-blue/20"
        title="Download Attachment (Use Caution!)"
      >
        <Download className="w-5 h-5" />
      </button>
    </div>
  );
}
