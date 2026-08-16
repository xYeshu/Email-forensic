import { useState } from 'react';
import { FileText, Eye, ChevronDown, ChevronUp, AlertTriangle, Maximize2, Minimize2, ShieldAlert, Copy, Check, FileCode } from 'lucide-react';
import type { AnalyzedEmail } from '../types';
import { InfoTooltip } from './InfoTooltip';
import { cn } from '../lib/utils';

interface EmailPreviewPanelProps {
  email: AnalyzedEmail;
}

type MainTab = 'raw' | 'user-view';
type RawSubTab = 'full-eml' | 'body-text' | 'html-source';

export function EmailPreviewPanel({ email }: EmailPreviewPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('raw');
  const [activeRawSubTab, setActiveRawSubTab] = useState<RawSubTab>('full-eml');
  const [userViewConsented, setUserViewConsented] = useState(false);
  const [isFullHeight, setIsFullHeight] = useState(false);
  const [copied, setCopied] = useState(false);

  const htmlContent = email.html;
  const hasHtml = !!htmlContent && htmlContent.trim().length > 0;
  const rawEml = email.rawEml || '';
  const bodyText = email.body || '';

  // Get active text content for copying and display
  const getActiveRawContent = () => {
    switch (activeRawSubTab) {
      case 'full-eml':
        return rawEml || bodyText || '(Raw .EML data not available)';
      case 'body-text':
        return bodyText || '(No plain text body found)';
      case 'html-source':
        return htmlContent || '(No HTML source found)';
    }
  };

  const activeRawText = getActiveRawContent();

  const handleCopy = async () => {
    if (!activeRawText) return;
    try {
      await navigator.clipboard.writeText(activeRawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const safeHtml = hasHtml
    ? `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #ffffff;
      color: #1a1a1a;
      overflow-x: hidden;
      word-break: break-word;
    }
    img { max-width: 100%; height: auto; }
    a { pointer-events: none; color: #2563eb; }
    table { max-width: 100% !important; }
  </style>
</head>
<body>${htmlContent}</body>
</html>`
    : '';

  return (
    <div className="bg-bg-card border border-border-color shadow-lg mt-6">
      <div
        className={cn(
          "px-6 py-4 flex items-center justify-between bg-bg-panel cursor-pointer border-border-color",
          expanded ? "border-b" : ""
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <FileText className="w-6 h-6 text-accent-cyan" />
          <h2 className="text-xl font-semibold text-text-primary flex items-center">
            Email Content Preview
            <InfoTooltip content={
              <div className="space-y-2">
                <p><strong>Raw Content:</strong> Inspect the complete unmodified .EML file source (headers, MIME boundaries, base64 payloads) or extracted plaintext/HTML bodies.</p>
                <p><strong>User View:</strong> Visual rendered HTML preview showing exactly what the recipient saw in their mail client (sandboxed for safety).</p>
              </div>
            } />
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs font-mono text-text-muted bg-bg-dark border border-border-color px-2 py-0.5 hidden sm:inline-block">
            {rawEml ? `${(rawEml.length / 1024).toFixed(1)} KB Raw` : 'Raw / User View'}
          </span>
          {expanded ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
        </div>
      </div>

      {expanded && (
        <div className="p-6 space-y-4">
          {/* Main Tab Switcher */}
          <div className="flex items-center justify-between border-b border-border-color">
            <div className="flex items-center">
              <button
                onClick={() => setActiveMainTab('raw')}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center space-x-2",
                  activeMainTab === 'raw'
                    ? "text-accent-cyan border-accent-cyan"
                    : "text-text-muted border-transparent hover:text-text-primary hover:border-border-color"
                )}
              >
                <FileCode className="w-4 h-4" />
                <span>Raw Content (.EML)</span>
              </button>
              <button
                onClick={() => setActiveMainTab('user-view')}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center space-x-2",
                  activeMainTab === 'user-view'
                    ? "text-accent-cyan border-accent-cyan"
                    : "text-text-muted border-transparent hover:text-text-primary hover:border-border-color"
                )}
              >
                <Eye className="w-4 h-4" />
                <span>User View (Recipient)</span>
                {hasHtml && (
                  <span className="text-[10px] bg-accent-orange/10 text-accent-orange border border-accent-orange/30 px-1.5 py-0.5 rounded font-mono font-bold">
                    HTML
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Raw Content Tab */}
          {activeMainTab === 'raw' && (
            <div className="space-y-3">
              {/* Sub-navigation & Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-bg-panel p-2 border border-border-color">
                {/* Sub tabs */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setActiveRawSubTab('full-eml')}
                    className={cn(
                      "px-3 py-1 text-xs font-medium transition-colors border",
                      activeRawSubTab === 'full-eml'
                        ? "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40 font-bold"
                        : "bg-bg-dark text-text-muted border-border-color hover:text-text-primary"
                    )}
                  >
                    Full Raw .EML (Headers + MIME)
                  </button>
                  <button
                    onClick={() => setActiveRawSubTab('body-text')}
                    className={cn(
                      "px-3 py-1 text-xs font-medium transition-colors border",
                      activeRawSubTab === 'body-text'
                        ? "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40 font-bold"
                        : "bg-bg-dark text-text-muted border-border-color hover:text-text-primary"
                    )}
                  >
                    Extracted Plain Text
                  </button>
                  {hasHtml && (
                    <button
                      onClick={() => setActiveRawSubTab('html-source')}
                      className={cn(
                        "px-3 py-1 text-xs font-medium transition-colors border",
                        activeRawSubTab === 'html-source'
                          ? "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40 font-bold"
                          : "bg-bg-dark text-text-muted border-border-color hover:text-text-primary"
                      )}
                    >
                      Raw HTML Source
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono text-text-muted hidden md:inline">
                    {activeRawText.split('\n').length} lines · {(activeRawText.length / 1024).toFixed(1)} KB
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center space-x-1.5 px-2.5 py-1 text-xs bg-bg-dark border border-border-color hover:border-accent-cyan hover:text-accent-cyan transition-colors"
                    title="Copy active raw content"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-accent-green" /> : <Copy className="w-3.5 h-3.5 text-text-muted" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Raw Editor View */}
              <div className="relative">
                <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap overflow-x-auto max-h-[500px] custom-scrollbar bg-bg-dark p-4 border border-border-color break-all leading-relaxed select-text">
                  {activeRawText}
                </pre>
              </div>
            </div>
          )}

          {/* User View Tab */}
          {activeMainTab === 'user-view' && (
            <div>
              {!hasHtml ? (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                  <Eye className="w-10 h-10 text-text-muted opacity-40" />
                  <p className="text-text-primary font-semibold text-sm">Plain Text Email (No HTML Body)</p>
                  <p className="text-text-muted text-xs max-w-md">
                    This email was sent in plaintext format without rich HTML rendering. The recipient viewed the plaintext content displayed in the "Raw Content → Extracted Plain Text" tab.
                  </p>
                </div>
              ) : !userViewConsented ? (
                /* Consent Gate */
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-5 bg-bg-panel border border-border-color p-8">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center bg-accent-orange/10 border border-accent-orange/30">
                    <ShieldAlert className="w-8 h-8 text-accent-orange" />
                  </div>
                  <div className="max-w-md space-y-2">
                    <h3 className="text-base font-bold text-text-primary">Render Email Recipient View?</h3>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      This will render the email's HTML body inside a sandboxed browser environment to display what the recipient visually saw.
                    </p>
                    <div className="p-3 bg-bg-dark border border-border-color text-xs text-left text-text-muted space-y-1">
                      <p className="font-semibold text-text-primary text-[11px] uppercase tracking-wider">Security Sandbox Controls Active:</p>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                        <li>JavaScript execution is completely disabled</li>
                        <li>Hyperlinks and external navigations are neutralized</li>
                        <li>Embedded forms cannot submit data</li>
                      </ul>
                    </div>
                  </div>
                  <button
                    onClick={() => setUserViewConsented(true)}
                    className="px-6 py-2.5 bg-accent-orange/15 hover:bg-accent-orange/25 text-accent-orange font-bold text-xs uppercase tracking-wider transition-colors flex items-center space-x-2 border border-accent-orange/40"
                  >
                    <Eye className="w-4 h-4" />
                    <span>I Understand, Render Preview</span>
                  </button>
                </div>
              ) : (
                /* Rendered User View */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-text-muted">
                      <AlertTriangle className="w-3.5 h-3.5 text-accent-orange" />
                      <span>Sandboxed iframe preview — all scripts and links disabled</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setUserViewConsented(false)}
                        className="text-xs text-text-muted hover:text-text-primary transition-colors px-2 py-1 border border-border-color"
                      >
                        Hide Preview
                      </button>
                      <button
                        onClick={() => setIsFullHeight(!isFullHeight)}
                        className="flex items-center space-x-1 text-xs text-text-muted hover:text-text-primary transition-colors px-2 py-1 border border-border-color"
                        title={isFullHeight ? 'Collapse' : 'Expand to full height'}
                      >
                        {isFullHeight ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                        <span>{isFullHeight ? 'Collapse' : 'Expand'}</span>
                      </button>
                    </div>
                  </div>

                  <div className={cn(
                    "border border-border-color bg-white overflow-hidden transition-all duration-300",
                    isFullHeight ? "h-[800px]" : "h-[450px]"
                  )}>
                    <iframe
                      srcDoc={safeHtml}
                      sandbox=""
                      title="Email recipient preview"
                      className="w-full h-full border-0"
                      style={{ pointerEvents: 'none' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
