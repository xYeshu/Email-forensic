import { useState } from 'react';
import { Mail, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import type { AnalyzedEmail } from '../types';
import { InfoTooltip } from './InfoTooltip';

export function HeaderAnalysisPanel({ email }: { email: AnalyzedEmail }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-bg-card border border-border-color rounded-xl shadow-lg mb-6">
      <div
        className={`px-6 py-4 flex items-center justify-between bg-bg-panel cursor-pointer border-border-color ${expanded ? 'border-b rounded-t-xl' : 'rounded-xl'}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <Mail className="w-6 h-6 text-accent-cyan" />
          <h2 className="text-xl font-semibold text-text-primary flex items-center">
            Header Analysis
            <InfoTooltip content={
              <div className="space-y-2">
                <p><strong>Relevance:</strong> Email headers contain vital routing and authentication metadata.</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>SPF/DKIM/DMARC:</strong> Verify if the sender is authorized to send on behalf of the domain. Failures strongly indicate spoofing.</li>
                  <li><strong>Message-ID:</strong> A unique identifier that can be used to trace the email across systems.</li>
                  <li><strong>Reply-To Mismatch:</strong> Attackers often forge the 'From' address but set 'Reply-To' to their own address to receive your replies.</li>
                </ul>
              </div>
            } />
          </h2>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
      </div>

      {expanded && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider border-b border-border-color pb-2">Basic Information</h3>
            <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
              <span className="text-text-secondary">Subject:</span>
              <span className="text-text-primary font-medium">{email.subject}</span>

              <span className="text-text-secondary">From:</span>
              <span className="text-text-primary font-mono">{email.from ? `${email.from.name} <${email.from.address}>` : 'Unknown'}</span>

              <span className="text-text-secondary">To:</span>
              <span className="text-text-primary font-mono">{email.to.map(t => `<${t.address}>`).join(', ')}</span>

              <span className="text-text-secondary">Date:</span>
              <span className="text-text-primary">{email.date}</span>

              <span className="text-text-secondary">Message-ID:</span>
              <span className="text-text-primary font-mono text-xs break-all">{email.messageId}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider border-b border-border-color pb-2">Authentication & Routing</h3>

            <div className="grid grid-cols-[100px_1fr] gap-2 text-sm mb-4">
              <span className="text-text-secondary">SPF:</span>
              <span className={`font-bold ${email.authResults.spf === 'Pass' ? 'text-accent-green' : email.authResults.spf === 'Fail' ? 'text-accent-red' : 'text-text-muted'}`}>{email.authResults.spf}</span>

              <span className="text-text-secondary">DKIM:</span>
              <span className={`font-bold ${email.authResults.dkim === 'Pass' ? 'text-accent-green' : email.authResults.dkim === 'Fail' ? 'text-accent-red' : 'text-text-muted'}`}>{email.authResults.dkim}</span>

              <span className="text-text-secondary">DMARC:</span>
              <span className={`font-bold ${email.authResults.dmarc === 'Pass' ? 'text-accent-green' : email.authResults.dmarc === 'Fail' ? 'text-accent-red' : 'text-text-muted'}`}>{email.authResults.dmarc}</span>

              <span className="text-text-secondary">Return-Path:</span>
              <span className="text-text-primary font-mono text-xs break-all">{email.returnPath || 'N/A'}</span>
            </div>

            {email.replyTo.length > 0 && email.from?.address !== email.replyTo[0].address && (
              <div className="bg-accent-orange/10 border border-accent-orange/30 p-3 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-accent-orange shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-accent-orange">Suspicious Reply-To</p>
                  <p className="text-xs text-text-secondary mt-1">Reply-To address ({email.replyTo[0].address}) differs from From address ({email.from?.address}). This is a common indicator of spoofing or phishing.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
