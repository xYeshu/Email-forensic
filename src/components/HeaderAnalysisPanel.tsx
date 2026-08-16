import { useState } from 'react';
import { Mail, ChevronDown, ChevronUp, AlertCircle, ShieldCheck, Send, Inbox, FileText, CheckCircle2, XCircle, HelpCircle, ShieldAlert } from 'lucide-react';
import type { AnalyzedEmail } from '../types';
import { InfoTooltip } from './InfoTooltip';
import { cn } from '../lib/utils';

export function HeaderAnalysisPanel({ email }: { email: AnalyzedEmail }) {
  const [expanded, setExpanded] = useState(true);
  const [showRawAuth, setShowRawAuth] = useState(false);

  // Extract domains
  const getDomain = (addr?: string) => {
    if (!addr) return 'N/A';
    const match = addr.match(/@([a-zA-Z0-9.-]+)/);
    return match ? match[1].toLowerCase() : (addr.includes('@') ? addr.split('@')[1].toLowerCase() : 'N/A');
  };

  // P2 Sender (Header From)
  const p2SenderAddress = email.from?.address || '';
  const p2SenderName = email.from?.name || '';
  const p2SenderDomain = getDomain(p2SenderAddress);

  // P1 Sender (Envelope Sender / Return-Path)
  const p1SenderAddress = email.returnPath || '';
  const p1SenderDomain = getDomain(p1SenderAddress);

  const recipientAddresses = email.to.map(t => t.address);
  const recipientDomains = Array.from(new Set(recipientAddresses.map(a => getDomain(a)).filter(d => d !== 'N/A')));

  const ccAddresses = email.cc.map(c => c.address);
  const bccAddresses = email.bcc.map(b => b.address);

  const replyTo = email.replyTo.length > 0 ? email.replyTo[0] : null;
  const replyToAddress = replyTo?.address || '';
  const replyToDomain = getDomain(replyToAddress);

  // Alignment checks
  const hasP1P2Data = !!p2SenderDomain && p2SenderDomain !== 'N/A' && !!p1SenderDomain && p1SenderDomain !== 'N/A';
  const isP1P2Mismatch = hasP1P2Data && p2SenderDomain !== p1SenderDomain;
  const isReplyToMismatch = !!p2SenderDomain && p2SenderDomain !== 'N/A' && !!replyToDomain && replyToDomain !== 'N/A' && p2SenderDomain !== replyToDomain;

  const getAuthBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('pass')) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Pass</span>
        </span>
      );
    }
    if (s.includes('fail')) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-xs">
          <XCircle className="w-3.5 h-3.5" />
          <span>Fail</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-bg-dark border border-border-color text-text-muted font-medium text-xs">
        <HelpCircle className="w-3.5 h-3.5" />
        <span>{status || 'None / Not Found'}</span>
      </span>
    );
  };

  return (
    <div className="bg-bg-card border border-border-color shadow-lg mb-6">
      <div
        className={cn(
          "px-6 py-4 flex items-center justify-between bg-bg-panel cursor-pointer border-border-color",
          expanded ? "border-b" : ""
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <Mail className="w-6 h-6 text-accent-cyan" />
          <h2 className="text-xl font-semibold text-text-primary flex items-center">
            Header Analysis
            <InfoTooltip content={
              <div className="space-y-2">
                <p><strong>Comprehensive Header Forensics:</strong></p>
                <ul className="list-disc pl-4 space-y-1 text-xs">
                  <li><strong>Sender Details:</strong> Unifies visible sender (P2), envelope routing (P1), and Reply-To identities.</li>
                  <li><strong>Domain Alignment:</strong> Discrepancies between P1 and P2 indicate spoofing or relay exploitation.</li>
                  <li><strong>Authentication:</strong> SPF, DKIM, and DMARC verification.</li>
                </ul>
              </div>
            } />
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          {isP1P2Mismatch && (
            <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-3 h-3" />
              <span>P1 / P2 Mismatch</span>
            </span>
          )}
          <div className="hidden md:flex items-center space-x-2 text-xs font-mono">
            <span className="text-text-primary font-bold uppercase">Domain:</span>
            <span className="text-text-secondary bg-bg-dark border border-border-color px-2 py-0.5 font-mono">
              {p2SenderDomain}
            </span>
          </div>
          {expanded ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
        </div>
      </div>

      {expanded && (
        <div className="p-6 space-y-6">
          {/* ══════════════════════════════════════════════════════════════════
              UNIFIED SENDER SECTION (P1, P2, REPLY-TO, ALIGNMENT)
              ══════════════════════════════════════════════════════════════════ */}
          <div className="p-5 bg-bg-panel border border-border-color space-y-5">
            <div className="flex flex-wrap items-center justify-between border-b border-border-color pb-3 gap-2">
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4 text-zinc-400" />
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  Sender Identities & Routing (P1 / P2 / Reply-To)
                </h3>
              </div>

              {/* Status Badge */}
              {isP1P2Mismatch ? (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-xs uppercase tracking-wider">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>P1 / P2 Domain Mismatch Detected</span>
                </span>
              ) : p1SenderAddress ? (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>P1 & P2 Domains Aligned</span>
                </span>
              ) : null}
            </div>

            {/* 3-Column Grid: P2 Visible Sender | P1 Envelope Sender | Reply-To Target */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {/* P2 Visible Sender */}
              <div className="p-4 bg-bg-dark border border-border-color space-y-3">
                <div className="flex items-center justify-between border-b border-border-color/60 pb-2">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    P2 Sender (Visible From)
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-bold text-text-primary uppercase block mb-1">Display Name:</span>
                    <div className="text-text-secondary font-medium text-xs truncate" title={p2SenderName}>
                      {p2SenderName || '<None specified>'}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-text-primary uppercase block mb-1">From Address:</span>
                    <div className="text-text-secondary font-mono text-xs break-all bg-bg-panel px-2 py-1 border border-border-color">
                      {p2SenderAddress || 'Unknown'}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-text-primary uppercase block mb-1">Sender Domain (P2):</span>
                    <div className="text-text-secondary font-mono text-xs break-all bg-bg-panel px-2 py-1 border border-border-color">
                      {p2SenderDomain}
                    </div>
                  </div>
                </div>
              </div>

              {/* P1 Envelope Sender (Return-Path) */}
              <div className="p-4 bg-bg-dark border border-border-color space-y-3">
                <div className="flex items-center justify-between border-b border-border-color/60 pb-2">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    P1 Sender (Return-Path)
                  </span>
                  {isP1P2Mismatch && (
                    <span className="text-[10px] text-red-400 font-bold uppercase">Mismatch</span>
                  )}
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-bold text-text-primary uppercase block mb-1">Envelope Address:</span>
                    <div className="text-text-secondary font-mono text-xs break-all bg-bg-panel px-2 py-1 border border-border-color">
                      {p1SenderAddress || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-text-primary uppercase block mb-1">Return-Path Domain (P1):</span>
                    <div className="text-text-secondary font-mono text-xs break-all bg-bg-panel px-2 py-1 border border-border-color">
                      {p1SenderDomain}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-text-primary uppercase block mb-1">P1 vs P2 Status:</span>
                    <div className="text-xs font-mono">
                      {isP1P2Mismatch ? (
                        <span className="text-red-400 font-bold">Different Domain ({p1SenderDomain})</span>
                      ) : p1SenderAddress ? (
                        <span className="text-emerald-400 font-bold">Matching Domain</span>
                      ) : (
                        <span className="text-text-muted">Not Specified</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reply-To Target */}
              <div className="p-4 bg-bg-dark border border-border-color space-y-3">
                <div className="flex items-center justify-between border-b border-border-color/60 pb-2">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Reply-To Routing
                  </span>
                  {isReplyToMismatch && (
                    <span className="text-[10px] text-red-400 font-bold uppercase">Mismatch</span>
                  )}
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-bold text-text-primary uppercase block mb-1">Reply-To Address:</span>
                    <div className="text-text-secondary font-mono text-xs break-all bg-bg-panel px-2 py-1 border border-border-color">
                      {replyToAddress ? (replyTo?.name ? `${replyTo.name} <${replyToAddress}>` : replyToAddress) : 'Same as From address'}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-text-primary uppercase block mb-1">Reply-To Domain:</span>
                    <div className="text-text-secondary font-mono text-xs break-all bg-bg-panel px-2 py-1 border border-border-color">
                      {replyToDomain}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-text-primary uppercase block mb-1">Reply-To vs P2 Status:</span>
                    <div className="text-xs font-mono">
                      {isReplyToMismatch ? (
                        <span className="text-amber-400 font-bold">Diverted to {replyToDomain}</span>
                      ) : replyToAddress ? (
                        <span className="text-emerald-400 font-bold">Standard Alignment</span>
                      ) : (
                        <span className="text-text-muted">Default (From Header)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Banner */}
            {(isP1P2Mismatch || isReplyToMismatch) && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 flex items-start space-x-3 text-xs text-text-secondary">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-400 uppercase tracking-wider">Routing Discrepancy Warning</p>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    {isP1P2Mismatch && `Visible sender (P2: ${p2SenderDomain}) does not match the actual envelope sending domain (P1: ${p1SenderDomain}). `}
                    {isReplyToMismatch && `Replies are configured to redirect to ${replyToDomain} instead of ${p2SenderDomain}.`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              RECIPIENT & AUTHENTICATION (SIDE BY SIDE)
              ══════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recipient Column */}
            <div className="p-4 bg-bg-panel border border-border-color space-y-4">
              <div className="flex items-center justify-between border-b border-border-color pb-2.5">
                <div className="flex items-center space-x-2">
                  <Inbox className="w-4 h-4 text-zinc-400" />
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Recipient Identity (To / CC / BCC)
                  </h3>
                </div>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="grid grid-cols-[130px_1fr] gap-2 items-start">
                  <span className="text-xs font-bold text-text-primary uppercase">To Address(es):</span>
                  <div className="space-y-1">
                    {email.to.length > 0 ? (
                      email.to.map((t, i) => (
                        <div key={i} className="text-text-secondary font-mono text-xs break-all bg-bg-dark px-2 py-1 border border-border-color">
                          {t.name ? `${t.name} <${t.address}>` : t.address}
                        </div>
                      ))
                    ) : (
                      <span className="text-text-secondary text-xs">None / Undisclosed</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-[130px_1fr] gap-2 items-start">
                  <span className="text-xs font-bold text-text-primary uppercase">Recipient Domain:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {recipientDomains.length > 0 ? (
                      recipientDomains.map((d, i) => (
                        <span key={i} className="text-text-secondary font-mono text-xs break-all bg-bg-dark px-2 py-1 border border-border-color">
                          {d}
                        </span>
                      ))
                    ) : (
                      <span className="text-text-secondary text-xs font-mono bg-bg-dark px-2 py-1 border border-border-color">N/A</span>
                    )}
                  </div>
                </div>

                {ccAddresses.length > 0 && (
                  <div className="grid grid-cols-[130px_1fr] gap-2 items-start pt-1 border-t border-border-color/50">
                    <span className="text-xs font-bold text-text-primary uppercase">CC:</span>
                    <div className="space-y-1">
                      {email.cc.map((c, i) => (
                        <div key={i} className="text-text-secondary font-mono text-xs break-all bg-bg-dark px-2 py-1 border border-border-color">
                          {c.name ? `${c.name} <${c.address}>` : c.address}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {bccAddresses.length > 0 && (
                  <div className="grid grid-cols-[130px_1fr] gap-2 items-start pt-1 border-t border-border-color/50">
                    <span className="text-xs font-bold text-text-primary uppercase">BCC:</span>
                    <div className="text-text-secondary font-mono text-xs bg-bg-dark px-2 py-1 border border-border-color">
                      {email.bcc.map(b => b.address).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Authentication Protocols */}
            <div className="p-4 bg-bg-panel border border-border-color space-y-4">
              <div className="flex items-center justify-between border-b border-border-color pb-2.5">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-zinc-400" />
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Email Authentication & DMARC</h3>
                </div>
                {email.authResults.raw && (
                  <button
                    onClick={() => setShowRawAuth(!showRawAuth)}
                    className="text-[11px] text-text-muted hover:text-text-primary underline transition-colors flex items-center space-x-1"
                  >
                    <FileText className="w-3 h-3" />
                    <span>{showRawAuth ? 'Hide Raw' : 'View Raw'}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* SPF */}
                <div className="p-3 bg-bg-dark border border-border-color flex flex-col items-center justify-center text-center space-y-1.5">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider">SPF (P1)</span>
                  <div>{getAuthBadge(email.authResults.spf)}</div>
                  <span className="text-[10px] text-text-muted">IP Authorization</span>
                </div>

                {/* DKIM */}
                <div className="p-3 bg-bg-dark border border-border-color flex flex-col items-center justify-center text-center space-y-1.5">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider">DKIM</span>
                  <div>{getAuthBadge(email.authResults.dkim)}</div>
                  <span className="text-[10px] text-text-muted">Cryptographic Sig</span>
                </div>

                {/* DMARC */}
                <div className="p-3 bg-bg-dark border border-border-color flex flex-col items-center justify-center text-center space-y-1.5">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider">DMARC</span>
                  <div>{getAuthBadge(email.authResults.dmarc)}</div>
                  <span className="text-[10px] text-text-muted">Domain Alignment</span>
                </div>
              </div>

              {/* Raw Authentication Results Dropdown */}
              {showRawAuth && email.authResults.raw && (
                <div className="space-y-1 pt-2 border-t border-border-color/50">
                  <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider">Raw Authentication-Results Header:</span>
                  <pre className="text-[11px] font-mono text-text-secondary bg-bg-dark p-2.5 border border-border-color overflow-x-auto custom-scrollbar whitespace-pre-wrap break-all max-h-32">
                    {email.authResults.raw}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              GENERAL METADATA BAR
              ══════════════════════════════════════════════════════════════════ */}
          <div className="p-4 bg-bg-panel border border-border-color space-y-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border-color pb-2">
              Message Metadata
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-text-primary font-bold uppercase block mb-1">Subject:</span>
                <span className="text-text-secondary font-medium text-sm break-words">{email.subject || '(No Subject)'}</span>
              </div>

              <div>
                <span className="text-text-primary font-bold uppercase block mb-1">Date & Timestamp:</span>
                <span className="text-text-secondary font-mono bg-bg-dark px-2 py-1 border border-border-color block">
                  {email.date || 'Unknown'}
                </span>
              </div>

              <div>
                <span className="text-text-primary font-bold uppercase block mb-1">Message-ID:</span>
                <span className="text-text-secondary font-mono text-[11px] break-all bg-bg-dark px-2 py-1 border border-border-color block">
                  {email.messageId || 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
