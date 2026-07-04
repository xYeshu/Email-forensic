import { useState } from 'react';
import { UploadZone } from './UploadZone';
import { HeaderAnalysisPanel } from './HeaderAnalysisPanel';
import { IocPanel } from './IocPanel';
import { AttachmentPanel } from './AttachmentPanel';
import { TimelinePanel } from './TimelinePanel';
import { AiPanel } from './AiPanel';
import { ContentAnalysisPanel } from './ContentAnalysisPanel';
import { DomainAnalysisPanel } from './DomainAnalysisPanel';
import type { AnalyzedEmail } from '../types';
import { parseEmlFile } from '../core/parser';
import { Shield, Trash2, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { InfoTooltip } from './InfoTooltip';

export function Dashboard() {
  const [email, setEmail] = useState<AnalyzedEmail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawExpanded, setRawExpanded] = useState(false);

  const handleFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const parsed = await parseEmlFile(file);
      setEmail(parsed);
    } catch (e: any) {
      console.error(e);
      setError("Failed to parse EML file. Please ensure it is a valid email file.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setEmail(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-bg-dark text-text-primary flex flex-col">
      {/* Header */}
      <header className="border-b border-border-color bg-bg-panel sticky top-0 z-40 backdrop-blur-md bg-opacity-80">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent-cyan/10 border border-accent-cyan/30 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-accent-cyan" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Email Forensic Analyser</h1>
              <p className="text-xs text-text-muted uppercase tracking-wider">One Stop Solution for Email Forensic and Analysis</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-4 py-8 flex-grow">
        {!email && !isLoading && (
          <div className="max-w-3xl mx-auto mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold text-text-primary">Advance Email Forensics analysis</h2>
              <p className="text-text-secondary text-lg">
                Analyze headers, extract indicators of compromise (IOCs), and use AI to detect phishing attempts without sending your sensitive emails to a server.
              </p>
            </div>
            <UploadZone onFileSelect={handleFile} isLoading={isLoading} />
            {error && (
              <div className="p-4 bg-accent-red/10 border border-accent-red/30 rounded-lg text-accent-red text-center">
                {error}
              </div>
            )}
          </div>
        )}

        {isLoading && !email && (
          <div className="max-w-3xl mx-auto mt-12">
            <UploadZone onFileSelect={handleFile} isLoading={isLoading} />
          </div>
        )}

        {email && (
          <div className="animate-in fade-in duration-500 space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-between bg-bg-panel p-4 rounded-xl border border-border-color shadow-sm mb-6">
              <div className="flex items-center space-x-4">
                <div className={cn(
                  "px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider border",
                  email.riskScore >= 80 ? 'bg-accent-red/10 text-accent-red border-accent-red/30' :
                  email.riskScore >= 40 ? 'bg-accent-orange/10 text-accent-orange border-accent-orange/30' :
                  'bg-accent-green/10 text-accent-green border-accent-green/30'
                )}>
                  Static Risk Score: {email.riskScore}/100
                </div>
                <div className="flex items-center text-sm text-text-secondary">
                  <InfoTooltip content={
                    <div className="space-y-1">
                      <p className="font-semibold mb-2 text-text-primary">Score Justification:</p>
                      <ul className="list-disc pl-4 space-y-1 text-xs">
                        {email.justification?.map((reason, i) => (
                          <li key={i}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  } />
                </div>
              </div>
              <button 
                onClick={handleReset}
                className="flex items-center space-x-2 px-4 py-2 bg-bg-dark border border-border-color hover:border-accent-red hover:text-accent-red rounded-lg transition-colors text-sm font-medium text-text-muted"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Analysis</span>
              </button>
            </div>

            {/* AI Panel */}
            <AiPanel email={email} />



            {/* Core Panels */}
            <HeaderAnalysisPanel email={email} />
            <IocPanel email={email} />
            <AttachmentPanel email={email} />
            <TimelinePanel email={email} />

            {/* Content / Body Analysis Panel */}
            <ContentAnalysisPanel email={email} />

            {/* Domain Impersonation Analysis Panel */}
            <DomainAnalysisPanel email={email} />
            
            {/* Raw Body Content (Optional viewing) */}
            <div className="bg-bg-card border border-border-color rounded-xl shadow-lg mt-6">
               <div 
                 className={`px-6 py-4 flex items-center justify-between bg-bg-panel cursor-pointer border-border-color ${rawExpanded ? 'border-b rounded-t-xl' : 'rounded-xl'}`}
                 onClick={() => setRawExpanded(!rawExpanded)}
               >
                 <div className="flex items-center space-x-3">
                   <FileText className="w-6 h-6 text-text-muted" />
                   <h2 className="text-xl font-semibold text-text-primary">Raw Content Preview</h2>
                 </div>
                 {rawExpanded ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
               </div>
               
               {rawExpanded && (
                 <div className="p-6">
                    <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap overflow-x-auto max-h-96 custom-scrollbar bg-bg-dark p-4 rounded border border-border-color">
                       {email.body || email.html || 'No readable text content found.'}
                    </pre>
                 </div>
               )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-text-muted mt-auto">
        <a 
          href="https://yeshuwanjari.in" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-accent-cyan transition-colors"
        >
          A product by Y
        </a>
      </footer>
    </div>
  );
}
