import { useState } from 'react';
import { UploadZone } from './UploadZone';
import { HeaderAnalysisPanel } from './HeaderAnalysisPanel';
import { IocPanel } from './IocPanel';
import { AttachmentPanel } from './AttachmentPanel';
import { TimelinePanel } from './TimelinePanel';
import { AiPanel } from './AiPanel';
import { ContentAnalysisPanel } from './ContentAnalysisPanel';
import { DomainAnalysisPanel } from './DomainAnalysisPanel';
import MagicBento from './MagicBento';
import ShinyText from './ShinyText';
import Strands from './Strands';
import type { AnalyzedEmail } from '../types';
import { parseEmlFile } from '../core/parser';
import { Shield, Trash2, ChevronDown, ChevronUp, FileText, Lock, CheckCircle } from 'lucide-react';
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
      <header className="border-b border-border-color/20 bg-bg-panel/10 sticky top-0 z-40 backdrop-blur-md">
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
          <div className="max-w-6xl mx-auto mt-8 space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Hero & Upload Panel Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                {/* <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-xs font-semibold uppercase tracking-wider">
                  <span>Security First</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
                  <span>Local Execution</span>
                </div> */}
                
                <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                  <ShinyText
                    text="Advanced AI Email Forensic & Analysis Suite"
                    speed={2}
                    delay={0}
                    color="#9b9a9aff"
                    shineColor="#ffffff"
                    spread={120}
                    direction="left"
                    className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight"
                  />
                </h2>
                
                <p className="text-text-secondary text-lg leading-relaxed">
                  A high-performance, browser-native AI forensic engine designed to inspect headers, trace transmission hops, identify domain impersonation attacks, and run deep body content analysis with absolute data privacy.
                </p>

                <div className="flex items-center space-x-6 text-sm text-text-muted border-t border-border-color pt-6">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-accent-green" />
                    <span>Zero Server Uploads</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-accent-cyan" />
                    <span>Client-Side Parsing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-accent-purple" />
                    <span>Fast, Deep & Accurate</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-bg-panel  rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-cyan/5 rounded-full blur-3xl group-hover:bg-accent-cyan/10 transition-all duration-500" />
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-text-primary">Start for Free</h3>
                  <p className="text-xs text-text-muted">Upload or drop a standard email message format (.eml)</p>
                </div>
                <UploadZone onFileSelect={handleFile} isLoading={isLoading} />
                {error && (
                  <div className="mt-4 p-3 bg-accent-red/10 border border-accent-red/30 rounded-lg text-accent-red text-center text-sm">
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* Features Overview — MagicBento */}
            <div className="space-y-6 ">
              {/* Strands Component */}
              <div style={{ width: '100%', height: '300px', position: 'relative' }} >
                <Strands
                  colors={["#F97316", "#7C3AED", "#06B6D4"]}
                  count={3}
                  speed={0.5}
                  amplitude={1}
                  waviness={1}
                  thickness={0.7}
                  glow={2.0}
                  taper={2}
                  spread={1}
                  intensity={0.6}
                  saturation={1.5}
                  opacity={1}
                  scale={2}
                  glass={false}
                  refraction={1}
                  dispersion={1}
                  glassSize={1}
                />
              </div>

              <div className="text-left space-y-2 px-3">
                <h3 className="text-2xl font-bold tracking-tight">
                  <ShinyText
                    text="Engine Capabilities"
                    speed={2}
                    delay={0}
                    color="#9b9a9aff"
                    shineColor="#ffffff"
                    spread={120}
                    direction="left"
                    className="text-2xl font-bold tracking-tight"
                  />
                </h3>
                <p className="text-sm text-text-secondary">
                  A comprehensive array of specialized local analysis tools designed to examine headers, body, metadata, and routing vectors.
                </p>
              </div>

              <MagicBento
                textAutoHide={false}
                enableStars={true}
                enableSpotlight={true}
                enableBorderGlow={true}
                enableTilt={false}
                enableMagnetism={false}
                clickEffect={true}
                spotlightRadius={300}
                particleCount={10}
                glowColor="6, 182, 212"
              />
            </div>
          </div>
        )}

        {isLoading && !email && (
          <div className="max-w-md mx-auto mt-24 bg-bg-panel border border-border-color rounded-2xl p-8 text-center space-y-6 shadow-xl animate-pulse">
            <div className="w-16 h-16 mx-auto border-4 border-accent-cyan border-t-transparent rounded-full animate-spin" />
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary">Performing Forensic Analysis</h3>
              <p className="text-sm text-text-muted">Decoding routing hops, parsing HTML structure, and auditing credentials locally...</p>
            </div>
          </div>
        )}

        {email && (
          <div className="animate-in fade-in duration-500 space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-between bg-bg-panel p-4 rounded-xl border border-border-color shadow-sm mb-6">
              <div className="flex items-center space-x-4">
                <div className={cn(
                  "px-4 py-2 rounded-lg font-bold text-sm  tracking-wider border",
                  email.riskScore >= 80 ? ' text-accent-red border-accent-red/30' :
                  email.riskScore >= 40 ? 'text-accent-orange border-accent-orange/30' :
                  'text-accent-green border-accent-green/30'
                )}>
                  Header Risk Score: {email.riskScore}/100
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
         Copyright © 2026 | Powered by Google Gemini 3.5
        </a>
      </footer>
    </div>
  );
}
