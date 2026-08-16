import { useState } from 'react';
import { Code2, Eye, EyeOff, FormInput, Radio, ChevronDown, ChevronUp, AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { AnalyzedEmail, ContentFinding, ContentFindingSeverity } from '../types';
import { cn } from '../lib/utils';
import { InfoTooltip } from './InfoTooltip';

interface ContentAnalysisPanelProps {
  email: AnalyzedEmail;
}

const severityConfig: Record<ContentFindingSeverity, { label: string; color: string; bg: string; border: string; dot: string }> = {
  critical: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', dot: 'bg-red-400' },
  high: { label: 'High', color: 'text-accent-orange', bg: 'bg-accent-orange/10', border: 'border-accent-orange/30', dot: 'bg-accent-orange' },
  medium: { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  low: { label: 'Low', color: 'text-accent-cyan', bg: 'bg-accent-cyan/10', border: 'border-accent-cyan/30', dot: 'bg-accent-cyan' },
  info: { label: 'Info', color: 'text-text-muted', bg: 'bg-bg-panel', border: 'border-border-color', dot: 'bg-text-muted' },
};

const typeConfig: Record<string, { icon: typeof Code2; label: string; color: string }> = {
  'hidden-text': { icon: EyeOff, label: 'Hidden Text', color: 'text-accent-purple' },
  'tracking-pixel': { icon: Radio, label: 'Tracking Pixel', color: 'text-amber-400' },
  'suspicious-form': { icon: FormInput, label: 'Suspicious Form', color: 'text-red-400' },
  'embedded-script': { icon: Code2, label: 'Embedded Script', color: 'text-red-400' },
  'encoded-content': { icon: Code2, label: 'Encoded Content', color: 'text-accent-orange' },
  'data-uri': { icon: Code2, label: 'Data URI', color: 'text-accent-orange' },
};

function FindingCard({ finding }: { finding: ContentFinding }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const severity = severityConfig[finding.severity];
  const typeInfo = typeConfig[finding.type] || { icon: AlertTriangle, label: finding.type, color: 'text-text-muted' };
  const TypeIcon = typeInfo.icon;

  return (
    <div className={cn(
      "border overflow-hidden transition-all duration-200",
      severity.border,
      isExpanded ? 'shadow-md' : 'hover:shadow-sm'
    )}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left bg-bg-panel hover:bg-bg-dark/50 transition-colors"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className={cn("w-8 h-8 flex items-center justify-center shrink-0", severity.bg)}>
            <TypeIcon className={cn("w-4 h-4", typeInfo.color)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className={cn("text-xs font-bold uppercase tracking-wider px-1.5 py-0.5", severity.bg, severity.color)}>
                {severity.label}
              </span>
              <span className={cn("text-xs px-1.5 py-0.5 bg-bg-dark text-text-muted")}>
                {typeInfo.label}
              </span>
            </div>
            <p className="text-sm font-medium text-text-primary mt-1 truncate">{finding.title}</p>
          </div>
        </div>
        <div className="shrink-0 ml-3">
          {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 bg-bg-card border-t border-border-color space-y-3">
          <p className="text-xs text-text-secondary leading-relaxed">{finding.description}</p>
          {finding.evidence && (
            <div>
              <span className="text-xs font-semibold text-text-muted uppercase block mb-1">Offending Code / Evidence:</span>
              <pre className="text-xs font-mono text-text-secondary bg-bg-dark p-3 border border-border-color overflow-x-auto max-h-40 custom-scrollbar whitespace-pre-wrap break-all">
                {finding.evidence}
              </pre>
            </div>
          )}
          {finding.mitreTactic && (
            <div className="flex items-center space-x-2 text-xs text-text-muted pt-1">
              <span>MITRE ATT&CK:</span>
              <span className="font-mono text-accent-orange bg-accent-orange/10 px-1.5 py-0.5 border border-accent-orange/20">
                {finding.mitreTactic}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ContentAnalysisPanel({ email }: ContentAnalysisPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const ca = email.contentAnalysis;

  if (!ca) return null;

  const totalFindings = ca.findings.length;
  const isClean = totalFindings === 0;

  const counters = [
    { label: 'Hidden Text', count: ca.hiddenTextCount, icon: EyeOff, color: 'text-accent-purple', bg: 'bg-accent-purple/10' },
    { label: 'Tracking Pixels', count: ca.trackingPixelCount, icon: Radio, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Forms in Body', count: ca.suspiciousFormCount, icon: FormInput, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Scripts / Code', count: ca.embeddedScriptCount, icon: Code2, color: 'text-red-400', bg: 'bg-red-500/10' },
  ];

  return (
    <div className="bg-bg-card border border-border-color shadow-lg mb-6">
      <div
        className={cn("px-6 py-4 flex items-center justify-between bg-bg-panel cursor-pointer border-border-color", expanded ? "border-b" : "")}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <Code2 className="w-6 h-6 text-accent-cyan" />
          <h2 className="text-xl font-semibold text-text-primary flex items-center">
            HTML & Body Content Analysis
            <InfoTooltip content={
              <div className="space-y-2">
                <p><strong>Body Forensics:</strong></p>
                <ul className="list-disc pl-4 space-y-1 text-xs">
                  <li><strong>Hidden Text:</strong> Zero-font, transparent or off-screen text used to bypass Bayesian spam filters.</li>
                  <li><strong>Tracking Pixels:</strong> 1x1 invisible images used for read-receipt telemetry.</li>
                  <li><strong>Phishing Forms:</strong> Interactive input forms embedded directly in the email.</li>
                  <li><strong>Embedded Scripts:</strong> JavaScript or VBScript tags that execute on vulnerable clients.</li>
                </ul>
              </div>
            } />
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <span className={cn(
            "text-xs font-bold uppercase tracking-wider px-3 py-1 border flex items-center space-x-1.5",
            isClean ? 'bg-accent-green/10 text-accent-green border-accent-green/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
          )}>
            {isClean ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Clean Body</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{totalFindings} Finding{totalFindings > 1 ? 's' : ''}</span>
              </>
            )}
          </span>
          {expanded ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
        </div>
      </div>

      {expanded && (
        <div className="p-6">
          {!ca.hasHtml && (
            <div className="mb-4 p-3 bg-bg-panel border border-border-color text-text-muted text-xs flex items-center space-x-2">
              <Eye className="w-4 h-4 text-accent-cyan" />
              <span>Plain text email only — No HTML or CSS evasion techniques found.</span>
            </div>
          )}

          {/* Quick Counter Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {counters.map(({ label, count, icon: Icon, color, bg }) => {
              const isAlert = count > 0;
              return (
                <div
                  key={label}
                  className={cn(
                    "flex flex-col items-center p-3 border transition-colors",
                    isAlert ? `${bg} border-red-500/30` : 'bg-bg-panel border-border-color',
                  )}
                >
                  <Icon className={cn("w-5 h-5 mb-1", isAlert ? color : 'text-text-muted')} />
                  <span className={cn("text-xl font-bold font-mono", isAlert ? color : 'text-text-primary')}>
                    {count}
                  </span>
                  <span className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">{label}</span>
                </div>
              );
            })}
          </div>

          {/* Findings List */}
          {isClean ? (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-bg-panel border border-border-color">
              <ShieldCheck className="w-12 h-12 text-accent-green mb-2" />
              <p className="text-sm font-semibold text-text-primary">No Malicious HTML or Evasion Tactics Detected</p>
              <p className="text-xs text-text-muted mt-1 max-w-md">
                No hidden text, phishing forms, tracking beacons, or dangerous script payloads were discovered in the body.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                Detected Content Anomalies ({totalFindings})
              </h3>
              {ca.findings.map((f, i) => (
                <FindingCard key={`${f.type}-${i}`} finding={f} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
