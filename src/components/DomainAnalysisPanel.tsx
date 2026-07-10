import { useState } from 'react';
import { Globe, ShieldAlert, ShieldCheck, ChevronDown, ChevronUp, Fingerprint, Type, Layers, Combine, Target } from 'lucide-react';
import type { AnalyzedEmail, DomainFinding } from '../types';
import { cn } from '../lib/utils';
import { InfoTooltip } from './InfoTooltip';

interface DomainAnalysisPanelProps {
  email: AnalyzedEmail;
}

const severityConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  high: { label: 'High', color: 'text-accent-orange', bg: 'bg-accent-orange/10', border: 'border-accent-orange/30' },
  medium: { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  low: { label: 'Low', color: 'text-accent-cyan', bg: 'bg-accent-cyan/10', border: 'border-accent-cyan/30' },
  info: { label: 'Info', color: 'text-text-muted', bg: 'bg-bg-panel', border: 'border-border-color' },
};

const typeConfig: Record<string, { icon: typeof Globe; label: string; color: string }> = {
  'homograph': { icon: Fingerprint, label: 'Homograph', color: 'text-red-400' },
  'punycode': { icon: Globe, label: 'Punycode/IDN', color: 'text-accent-orange' },
  'typosquat': { icon: Type, label: 'Typosquat', color: 'text-amber-400' },
  'subdomain-abuse': { icon: Layers, label: 'Subdomain Abuse', color: 'text-accent-purple' },
  'combosquat': { icon: Combine, label: 'Combo-squat', color: 'text-accent-cyan' },
};

function DomainFindingCard({ finding }: { finding: DomainFinding }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const severity = severityConfig[finding.severity] || severityConfig.info;
  const typeInfo = typeConfig[finding.type] || { icon: Globe, label: finding.type, color: 'text-text-muted' };
  const TypeIcon = typeInfo.icon;

  return (
    <div className={cn("border rounded-lg overflow-hidden transition-all duration-200", severity.border, isExpanded ? 'shadow-md' : 'hover:shadow-sm')}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left bg-bg-panel hover:bg-bg-dark/50 transition-colors"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", severity.bg)}>
            <TypeIcon className={cn("w-4 h-4", typeInfo.color)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className={cn("text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded", severity.bg, severity.color)}>
                {severity.label}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-bg-dark text-text-muted">
                {typeInfo.label}
              </span>
              {finding.brand !== 'Unknown' && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-accent-purple/10 text-accent-purple flex items-center space-x-1">
                  <Target className="w-3 h-3" />
                  <span>{finding.brand}</span>
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-text-primary mt-1 truncate">{finding.title}</p>
          </div>
        </div>
        <div className="shrink-0 ml-3 flex items-center space-x-2">
          <span className="text-xs font-mono text-text-muted">{finding.confidence}%</span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 space-y-3 bg-bg-card border-t border-border-color/50 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-sm text-text-secondary leading-relaxed">{finding.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-bg-panel rounded-lg border border-border-color">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1">Suspicious Domain</span>
              <code className="text-sm font-mono text-red-400 break-all">{finding.suspiciousDomain}</code>
            </div>
            {finding.legitimateDomain !== 'N/A' && (
              <div className="p-3 bg-bg-panel rounded-lg border border-border-color">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1">Legitimate Domain</span>
                <code className="text-sm font-mono text-accent-green break-all">{finding.legitimateDomain}</code>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-text-muted uppercase tracking-wider">Technique:</span>
              <span className="font-mono text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded">{finding.technique}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-text-muted uppercase tracking-wider">Confidence:</span>
              <div className="flex items-center space-x-1">
                <div className="w-16 h-1.5 bg-bg-dark rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all",
                      finding.confidence >= 80 ? 'bg-red-400' :
                        finding.confidence >= 60 ? 'bg-accent-orange' : 'bg-amber-400'
                    )}
                    style={{ width: `${finding.confidence}%` }}
                  />
                </div>
                <span className="font-mono text-text-secondary">{finding.confidence}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DomainAnalysisPanel({ email }: DomainAnalysisPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const da = email.domainAnalysis;
  const totalFindings = da.findings.length;

  // Determine the highest severity for the badge
  const severityOrder = ['critical', 'high', 'medium', 'low', 'info'];
  const highestSeverity = totalFindings > 0
    ? da.findings.reduce((max, f) => severityOrder.indexOf(f.severity) < severityOrder.indexOf(max) ? f.severity : max, 'info' as string)
    : 'info';
  const badgeSeverity = severityConfig[highestSeverity];

  const counters = [
    { label: 'Homograph', count: da.homographCount, icon: Fingerprint, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Punycode', count: da.punycodeCount, icon: Globe, color: 'text-accent-orange', bg: 'bg-accent-orange/10' },
    { label: 'Typosquat', count: da.typosquatCount, icon: Type, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Subdomain', count: da.subdomainAbuseCount, icon: Layers, color: 'text-accent-purple', bg: 'bg-accent-purple/10' },
    { label: 'Combo-squat', count: da.comboSquatCount, icon: Combine, color: 'text-accent-cyan', bg: 'bg-accent-cyan/10' },
  ];

  return (
    <div className="bg-bg-card border border-border-color rounded-xl shadow-lg mb-6">
      <div
        className={cn("px-6 py-4 flex items-center justify-between bg-bg-panel cursor-pointer border-border-color", expanded ? "border-b rounded-t-xl" : "rounded-xl")}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <Globe className="w-6 h-6 text-accent-cyan" />
          <h2 className="text-xl font-semibold text-text-primary flex items-center">
            Domain Impersonation Analysis
            <InfoTooltip content={
              <div className="space-y-2">
                <p><strong>Relevance:</strong> Detects sender domain deception targeting known brands.</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Homograph:</strong> Character substitution using Cyrillic, Greek, or number look-alikes (e.g., pаypal → paypal).</li>
                  <li><strong>Punycode/IDN:</strong> Internationalized domains (xn--) that display Unicode look-alike characters.</li>
                  <li><strong>Typosquat:</strong> Domains with typos, extra/missing/swapped characters (e.g., paypa1, gogle).</li>
                  <li><strong>Subdomain Abuse:</strong> Brand names used as subdomains (e.g., paypal.com.evil.com).</li>
                  <li><strong>Combo-squat:</strong> Brand + suspicious words (e.g., paypal-secure.com).</li>
                </ul>
              </div>
            } />
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          {totalFindings > 0 && (
            <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border", badgeSeverity.bg, badgeSeverity.color, badgeSeverity.border)}>
              {totalFindings} Finding{totalFindings !== 1 ? 's' : ''}
            </span>
          )}
          {totalFindings === 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-accent-green/10 text-accent-green border-accent-green/30">
              {da.isExactBrandMatch ? 'Known Brand ✓' : 'No Impersonation'}
            </span>
          )}
          {expanded ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
        </div>
      </div>

      {expanded && (
        <div className="p-6">
          {/* Sender Domain Summary */}
          <div className="flex items-center space-x-4 mb-6 p-4 bg-bg-panel rounded-lg border border-border-color">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Sender Domain:</span>
              <code className={cn(
                "text-sm font-mono px-2 py-0.5 rounded",
                da.isExactBrandMatch ? 'text-accent-green bg-accent-green/10' : 'text-text-primary bg-bg-dark'
              )}>
                {da.senderDomain || 'N/A'}
              </code>
              {da.isExactBrandMatch && (
                <span className="flex items-center space-x-1 text-xs text-accent-green">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Matches known brand</span>
                </span>
              )}
            </div>
            {da.targetedBrands.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Targeted:</span>
                <div className="flex flex-wrap gap-1">
                  {da.targetedBrands.map((brand, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                      {brand}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {totalFindings === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ShieldCheck className="w-12 h-12 text-accent-green mb-3 opacity-60" />
              <p className="text-accent-green font-medium mb-1">No Domain Impersonation Detected</p>
              <p className="text-text-muted text-sm max-w-md">
                The sender domain and all domains found in the email body were checked against {'>'}35 known brand domains for homograph attacks, typosquatting, Punycode abuse, subdomain spoofing, and combo-squatting. No impersonation patterns were identified.
              </p>
            </div>
          )}

          {totalFindings > 0 && (
            <div className="space-y-6">
              {/* Detection Counters */}
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
                  <span>Impersonation Findings</span>
                </h3>
                <div className="space-y-3">
                  {da.findings.map((finding, i) => (
                    <DomainFindingCard key={i} finding={finding} />
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
