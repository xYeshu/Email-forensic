import { useState } from 'react';
import { BrainCircuit, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import type { AnalyzedEmail, AIAnalysisResult } from '../types';
import { analyzeWithAI } from '../core/ai';
import { cn } from '../lib/utils';
import { InfoTooltip } from './InfoTooltip';

interface AiPanelProps {
  email: AnalyzedEmail;
}

export function AiPanel({ email }: AiPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await analyzeWithAI(email);
      setResult(res);
      setExpanded(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-bg-card border border-border-color rounded-xl shadow-lg mb-6">
      <div 
        className={cn("px-6 py-4 flex items-center justify-between bg-bg-panel cursor-pointer border-border-color", expanded ? "border-b rounded-t-xl" : "rounded-xl")}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <BrainCircuit className="w-6 h-6 text-accent-purple" />
          <h2 className="text-xl font-semibold text-text-primary flex items-center">
            AI Analyst Investigation
            <InfoTooltip content={
              <div className="space-y-2">
                <p><strong>Relevance:</strong> AI serves as a powerful triaging assistant.</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Correlations:</strong> AI can rapidly correlate text patterns, urgent language, and metadata anomalies.</li>
                  <li><strong>Social Engineering:</strong> Highly effective at identifying advanced social engineering tactics that evade standard regex.</li>
                  <li><strong>Remediation:</strong> Provides actionable steps for responding to the threat based on the findings.</li>
                </ul>
              </div>
            } />
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          {result && (
            <div className={cn(
              "px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-2 border",
              result.verdict === 'Malicious' ? 'bg-accent-red/10 text-accent-red border-accent-red/30' :
              result.verdict === 'Suspicious' ? 'bg-accent-orange/10 text-accent-orange border-accent-orange/30' :
              'bg-accent-green/10 text-accent-green border-accent-green/30'
            )}>
              <span>{result.verdict}</span>
              <span className="opacity-75">| Confidence: {result.confidence}%</span>
            </div>
          )}
          {expanded ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
        </div>
      </div>

      {expanded && (
        <div className="p-6">
          {!result && !isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BrainCircuit className="w-16 h-16 text-text-muted mb-4 opacity-50" />
              <p className="text-text-secondary mb-6 max-w-md">
                Trigger an AI-powered deep forensic analysis of this email to identify phishing tactics, impersonation attempts, and network indicators.
              </p>
              <button 
                onClick={handleAnalyze}
                className="px-6 py-2.5 bg-accent-purple hover:bg-accent-purple/80 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <BrainCircuit className="w-5 h-5" />
                <span>Run AI Analysis</span>
              </button>
              {error && <p className="mt-4 text-accent-red text-sm">{error}</p>}
            </div>
          )}

          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 border-4 border-accent-purple/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-accent-purple border-t-transparent rounded-full animate-spin"></div>
                <BrainCircuit className="absolute inset-0 m-auto w-8 h-8 text-accent-purple animate-pulse" />
              </div>
              <p className="text-accent-purple animate-pulse font-medium">AI Analyst is investigating...</p>
            </div>
          )}

          {result && !isAnalyzing && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Summary & Explanation */}
              <div className="col-span-1 md:col-span-2 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Executive Summary</h3>
                  <div className="p-4 bg-bg-panel rounded-lg border border-border-color">
                    <p className="text-text-primary leading-relaxed">{result.summary}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Detailed Analysis</h3>
                  <div className="p-4 bg-bg-panel rounded-lg border border-border-color">
                    <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">{result.explanation}</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Tactics, Indicators, Remediation */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-accent-orange" />
                    <span>Identified Techniques</span>
                  </h3>
                  <ul className="space-y-2">
                    {result.phishingTechniques.map((tech, i) => (
                      <li key={i} className="flex items-start space-x-2 text-sm text-text-secondary bg-bg-panel p-2 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-orange mt-1.5 shrink-0" />
                        <span>{tech}</span>
                      </li>
                    ))}
                    {result.phishingTechniques.length === 0 && <p className="text-sm text-text-muted">None detected.</p>}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-accent-green" />
                    <span>Remediation Actions</span>
                  </h3>
                  <ul className="space-y-2">
                    {result.remediation.map((rec, i) => (
                      <li key={i} className="flex items-start space-x-2 text-sm text-text-secondary bg-bg-panel p-2 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-green mt-1.5 shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
