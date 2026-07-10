import { useState } from 'react';
import { Code2, Eye, EyeOff, FormInput, Radio, ChevronDown, ChevronUp, AlertTriangle, ShieldAlert, Info } from 'lucide-react';
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
      "border rounded-lg overflow-hidden transition-all duration-200",
      severity.border,
      isExpanded ? 'shadow-md' : 'hover:shadow-sm'
    )}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left bg-bg-panel hover:bg-bg-dark/50 transition-colors"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", severity.bg)}>
            <TypeIcon className={cn("w-4 h-4", typeInfo.color)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className={cn("text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded", severity.bg, severity.color)}>
                {severity.label}
              </span>
              <span className={cn("text-xs px-1.5 py-0.5 rounded bg-bg-dark text-text-muted")}>
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
        <div className="px-4 pb-4 pt-2 space-y-3 bg-bg-card border-t border-border-color/50 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-sm text-text-secondary leading-relaxed">{finding.description}</p>

          {finding.mitreTactic && (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">MITRE ATT&CK:</span>
              <span className="text-xs font-mono text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded">{finding.mitreTactic}</span>
            </div>
          )}

          <div>
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1">Evidence</span>
            <pre className="text-xs font-mono text-text-secondary bg-bg-dark p-3 rounded border border-border-color overflow-x-auto custom-scrollbar whitespace-pre-wrap break-all">
              {finding.evidence}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export function ContentAnalysisPanel({ email }: ContentAnalysisPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const ca = email.contentAnalysis;

  const totalFindings = ca.findings.length;
  const overallSeverity = severityConfig[ca.overallRisk];

  const counters = [
    { label: 'Hidden Text', count: ca.hiddenTextCount, icon: EyeOff, color: 'text-accent-purple', bg: 'bg-accent-purple/10' },
    { label: 'Tracking Pixels', count: ca.trackingPixelCount, icon: Radio, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Suspicious Forms', count: ca.suspiciousFormCount, icon: FormInput, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Scripts / Encoded', count: ca.embeddedScriptCount, icon: Code2, color: 'text-accent-orange', bg: 'bg-accent-orange/10' },
  ];

  return (
    <div className="bg-bg-card border border-border-color rounded-xl shadow-lg mb-6">
      <div
        className={cn("px-6 py-4 flex items-center justify-between bg-bg-panel cursor-pointer border-border-color", expanded ? "border-b rounded-t-xl" : "rounded-xl")}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <Eye className="w-6 h-6 text-accent-cyan" />
          <h2 className="text-xl font-semibold text-text-primary flex items-center">
            Content / Body Analysis
            <InfoTooltip content={
              <div className="space-y-2">
                <p><strong>Relevance:</strong> Deep inspection of the email HTML body for malicious patterns.</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Hidden Text:</strong> Text concealed via CSS (display:none, font-size:0, opacity:0) to bypass filters.</li>
                  <li><strong>Tracking Pixels:</strong> 1×1 images or hidden image beacons that confirm email opens.</li>
                  <li><strong>Forms:</strong> Embedded HTML forms used for credential harvesting.</li>
                  <li><strong>Scripts:</strong> Embedded JavaScript, event handlers, data: URIs, encoded payloads.</li>
                </ul>
              </div>
            } />
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          {totalFindings > 0 && (
            <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border", overallSeverity.bg, overallSeverity.color, overallSeverity.border)}>
              {totalFindings} Finding{totalFindings !== 1 ? 's' : ''}
            </span>
          )}
          {totalFindings === 0 && ca.hasHtml && (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-accent-green/10 text-accent-green border-accent-green/30">
              Clean
            </span>
          )}
          {expanded ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
        </div>
      </div>

      {expanded && (
        <div className="p-6">
          {!ca.hasHtml && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Info className="w-12 h-12 text-text-muted mb-3 opacity-40" />
              <p className="text-text-muted text-sm">No HTML body detected in this email. Content analysis requires an HTML body.</p>
            </div>
          )}

          {ca.hasHtml && totalFindings === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Eye className="w-12 h-12 text-accent-green mb-3 opacity-60" />
              <p className="text-accent-green font-medium mb-1">No Suspicious Content Patterns Detected</p>
              <p className="text-text-muted text-sm max-w-md">
                The HTML body was scanned for hidden text, tracking pixels, credential harvesting forms, and embedded scripts. No suspicious patterns were identified.
              </p>
            </div>
          )}

          {ca.hasHtml && totalFindings > 0 && (
            <div className="space-y-6">
              {/* Summary Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {counters.map(({ label, count, icon: Icon, color, bg }) => (
                  <div
                    key={label}
                    className={cn(
                      "flex flex-col items-center p-3 rounded-lg border transition-colors",
                      count > 0 ? `${bg} border-current/20` : 'bg-bg-panel border-border-color',
                    )}
                  >
                    <Icon className={cn("w-5 h-5 mb-1.5", count > 0 ? color : 'text-text-muted opacity-40')} />
                    <span className={cn("text-2xl font-bold", count > 0 ? color : 'text-text-muted opacity-40')}>
                      {count}
                    </span>
                    <span className="text-xs text-text-muted text-center mt-0.5">{label}</span>
                  </div>
                ))}
              </div>

              {/* Findings List */}
              <div>
                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-accent-orange" />
                  <span>Detailed Findings</span>
                </h3>
                <div className="space-y-3">
                  {ca.findings.map((finding, i) => (
                    <FindingCard key={i} finding={finding} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
