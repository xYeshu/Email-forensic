import { useState } from 'react';
import { Globe, ShieldAlert, ShieldCheck, ChevronDown, ChevronUp, Fingerprint, Type, Layers, Combine, Target, UserX } from 'lucide-react';
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
  'display-name-spoof': { icon: UserX, label: 'Display Name Spoof', color: 'text-red-400' },
};

function DomainFindingCard({ finding }: { finding: DomainFinding }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const severity = severityConfig[finding.severity] || severityConfig.info;
  const typeInfo = typeConfig[finding.type] || { icon: Globe, label: finding.type, color: 'text-text-muted' };
  const TypeIcon = typeInfo.icon;

  return (
    <div className={cn("border overflow-hidden transition-all duration-200", severity.border, isExpanded ? 'shadow-md' : 'hover:shadow-sm')}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left bg-bg-panel hover:bg-bg-dark/50 transition-colors"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className={cn("w-8 h-8 flex items-center justify-center shrink-0", severity.bg)}>
            <TypeIcon className={cn("w-4 h-4", typeInfo.color)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className={cn("text-xs font-bold uppercase tracking-wider px-1.5 py-0.5", severity.bg, severity.color)}>
                {severity.label}
              </span>
              <span className="text-xs px-1.5 py-0.5 bg-bg-dark text-text-muted">
                {typeInfo.label}
              </span>
              {finding.brand !== 'Unknown' && (
                <span className="text-xs px-1.5 py-0.5  flex items-center space-x-1">
                  <Target className="w-3 h-3" />
                  <span>{finding.brand}</span>
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-text-primary mt-1 truncate">{finding.title}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 shrink-0 ml-2">
          <span className="text-xs font-mono text-text-muted hidden sm:inline">{finding.confidence}% confidence</span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 bg-bg-card border-t border-border-color space-y-4">
          <p className="text-xs text-text-secondary leading-relaxed">{finding.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-bg-panel border border-border-color">
              <span className="text-xs font-semibold text-text-muted uppercase block mb-1">Suspicious Domain</span>
              <code className="text-xs font-mono text-red-400 break-all">{finding.suspiciousDomain}</code>
            </div>
            {finding.legitimateDomain && (
              <div className="p-3 bg-bg-panel border border-border-color">
                <span className="text-xs font-semibold text-text-muted uppercase block mb-1">Legitimate Domain</span>
                <code className="text-xs font-mono text-accent-green break-all">{finding.legitimateDomain}</code>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border-color/50">
            <span>Attack Technique: <strong className="text-text-primary">{finding.technique}</strong></span>
            <span>Targeted Brand: <strong className="text-text-primary">{finding.brand}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}

export function DomainAnalysisPanel({ email }: DomainAnalysisPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const da = email.domainAnalysis;

  if (!da) return null;

  const totalFindings = da.findings.length;
  const criticalCount = da.findings.filter(f => f.severity === 'critical' || f.severity === 'high').length;

  const highestSeverity = totalFindings === 0
    ? 'clean'
    : criticalCount > 0
    ? 'critical'
    : 'info';

  const counters = [
    { label: 'Name Spoof', count: da.displayNameSpoofCount || 0, icon: UserX, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Homograph', count: da.homographCount, icon: Fingerprint, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Punycode', count: da.punycodeCount, icon: Globe, color: 'text-accent-orange', bg: 'bg-accent-orange/10' },
    { label: 'Typosquat', count: da.typosquatCount, icon: Type, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Subdomain', count: da.subdomainAbuseCount, icon: Layers, color: 'text-accent-purple', bg: 'bg-accent-purple/10' },
    { label: 'Combo-squat', count: da.comboSquatCount, icon: Combine, color: 'text-accent-cyan', bg: 'bg-accent-cyan/10' },
  ];

  return (
    <div className="bg-bg-card border border-border-color shadow-lg mb-6">
      <div
        className={cn("px-6 py-4 flex items-center justify-between bg-bg-panel cursor-pointer border-border-color", expanded ? "border-b" : "")}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <Globe className="w-6 h-6 text-accent-cyan" />
          <h2 className="text-xl font-semibold text-text-primary flex items-center">
            Domain Impersonation & Typosquatting Analysis
            <InfoTooltip content={
              <div className="space-y-2">
                <p><strong>Domain Impersonation Detection:</strong></p>
                <ul className="list-disc pl-4 space-y-1 text-xs">
                  <li><strong>Display Name Spoofing:</strong> Sender uses a trusted brand name while emailing from an unauthorized domain.</li>
                  <li><strong>Homographs / IDN:</strong> Cyrillic/Unicode characters mimicking Latin letters.</li>
                  <li><strong>Typosquatting & Combosquatting:</strong> Deceptive spelling or brand name + extra keywords.</li>
                </ul>
              </div>
            } />
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <span className={cn(
            "text-xs font-bold uppercase tracking-wider px-3 py-1 border flex items-center space-x-1.5",
            highestSeverity === 'clean' ? 'bg-accent-green/10 text-accent-green border-accent-green/30' :
              highestSeverity === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                'bg-accent-orange/10 text-accent-orange border-accent-orange/30'
          )}>
            {highestSeverity === 'clean' ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>No Domain Spoofing</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{totalFindings} Threat{totalFindings > 1 ? 's' : ''} Detected</span>
              </>
            )}
          </span>
          {expanded ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
        </div>
      </div>

      {expanded && (
        <div className="p-6">
          {/* Sender Domain Summary */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-bg-panel border border-border-color">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-text-muted uppercase">Sender Domain:</span>
              <code className="text-xs font-mono font-bold px-2 py-1 bg-bg-dark border border-border-color text-text-primary">
                {da.senderDomain || 'None'}
              </code>
            </div>

            {da.targetedBrands.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-text-muted uppercase">Targeted Brands:</span>
                <div className="flex flex-wrap gap-1.5">
                  {da.targetedBrands.map(b => (
                    <span key={b} className="text-xs font-bold px-2 py-0.5  border border-accent-purple/30 flex items-center space-x-1">
                      <Target className="w-3 h-3" />
                      <span>{b}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Counter Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
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
          {totalFindings === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-bg-panel border border-border-color">
              <ShieldCheck className="w-12 h-12 text-accent-green mb-2" />
              <p className="text-sm font-semibold text-text-primary">No Impersonation or Typosquatting Detected</p>
              <p className="text-xs text-text-muted mt-1 max-w-md">
                No homoglyphs, Punycode tricks, combo-squatting, or display name brand spoofing were identified.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                Detected Domain Impersonation Vectors ({totalFindings})
              </h3>
              {da.findings.map((f, i) => (
                <DomainFindingCard key={`${f.type}-${f.suspiciousDomain}-${i}`} finding={f} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
