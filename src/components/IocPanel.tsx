import { useState } from 'react';
import { Target, ChevronDown, ChevronUp, Link as LinkIcon, Globe, Hash, AtSign, MapPin, ExternalLink } from 'lucide-react';
import type { AnalyzedEmail } from '../types';
import { InfoTooltip } from './InfoTooltip';

export function IocPanel({ email }: { email: AnalyzedEmail }) {
  const [expanded, setExpanded] = useState(true);

  const { iocs } = email;
  const hasIocs = iocs.urls.length > 0 || iocs.domains.length > 0 || iocs.ips.length > 0 || iocs.emails.length > 0 || iocs.hashes.length > 0;

  return (
    <div className="bg-bg-card border border-border-color rounded-xl shadow-lg mb-6">
      <div
        className={`px-6 py-4 flex items-center justify-between bg-bg-panel cursor-pointer border-border-color ${expanded ? 'border-b rounded-t-xl' : 'rounded-xl'}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <Target className="w-6 h-6 text-accent-cyan" />
          <h2 className="text-xl font-semibold text-text-primary flex items-center">
            Indicators of Compromise (IOCs)
            <InfoTooltip content={
              <div className="space-y-2">
                <p><strong>Relevance:</strong> Extracted artifacts that may indicate malicious activity.</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>URLs/Domains:</strong> Check against Threat Intel for known phishing or malware hosting.</li>
                  <li><strong>IPs:</strong> Investigate external communication endpoints.</li>
                  <li><strong>Emails:</strong> Spot credential harvesting drops or fake sender domains.</li>
                  <li><strong>Hashes:</strong> File signatures that can be searched on VirusTotal to confirm malware.</li>
                </ul>
              </div>
            } />
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="px-3 py-1 bg-bg-dark rounded-full text-xs font-medium text-text-secondary border border-border-color">
            {iocs.urls.length + iocs.domains.length + iocs.ips.length + iocs.hashes.length} Found
          </div>
          {expanded ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
        </div>
      </div>

      {expanded && (
        <div className="p-6">
          {!hasIocs ? (
            <p className="text-text-muted text-center py-4">No significant IOCs detected in this email.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* URLs */}
              {iocs.urls.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-text-primary flex items-center space-x-2 border-b border-border-color pb-2">
                    <LinkIcon className="w-4 h-4 text-accent-cyan" />
                    <span>URLs ({iocs.urls.length})</span>
                  </h3>
                  <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {iocs.urls.map((url, i) => (
                      <li key={i} className="text-xs font-mono text-text-secondary bg-bg-panel p-2 rounded break-all border border-border-color hover:border-accent-cyan/50 transition-colors flex justify-between items-start group">
                        <span className="mr-2">{url}</span>
                        <a href={`https://urlscan.io/search/#page.url:"${encodeURIComponent(url)}"`} target="_blank" rel="noreferrer" title="Check on urlscan.io" className="text-text-muted hover:text-accent-cyan transition-opacity">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Domains */}
              {iocs.domains.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-text-primary flex items-center space-x-2 border-b border-border-color pb-2">
                    <Globe className="w-4 h-4 text-accent-blue" />
                    <span>Domains ({iocs.domains.length})</span>
                  </h3>
                  <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {iocs.domains.map((domain, i) => (
                      <li key={i} className="text-xs font-mono text-text-secondary bg-bg-panel p-2 rounded break-all border border-border-color hover:border-accent-blue/50 transition-colors flex justify-between items-start group">
                        <span className="mr-2">{domain}</span>
                        <a href={`https://www.virustotal.com/gui/domain/${domain}`} target="_blank" rel="noreferrer" title="Check on VirusTotal" className="text-text-muted hover:text-accent-blue transition-opacity">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* IPs */}
              {iocs.ips.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-text-primary flex items-center space-x-2 border-b border-border-color pb-2">
                    <MapPin className="w-4 h-4 text-accent-orange" />
                    <span>IP Addresses ({iocs.ips.length})</span>
                  </h3>
                  <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {iocs.ips.map((ip, i) => (
                      <li key={i} className="text-xs font-mono text-text-secondary bg-bg-panel p-2 rounded break-all border border-border-color hover:border-accent-orange/50 transition-colors flex justify-between items-start group">
                        <span className="mr-2">{ip}</span>
                        <a href={`https://www.abuseipdb.com/check/${ip}`} target="_blank" rel="noreferrer" title="Check on AbuseIPDB" className="text-text-muted hover:text-accent-orange transition-opacity">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Emails */}
              {iocs.emails.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-text-primary flex items-center space-x-2 border-b border-border-color pb-2">
                    <AtSign className="w-4 h-4 text-accent-green" />
                    <span>Email Addresses ({iocs.emails.length})</span>
                  </h3>
                  <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {iocs.emails.map((emailAddr, i) => (
                      <li key={i} className="text-xs font-mono text-text-secondary bg-bg-panel p-2 rounded break-all border border-border-color hover:border-accent-green/50 transition-colors">
                        {emailAddr}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hashes */}
              {iocs.hashes.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-text-primary flex items-center space-x-2 border-b border-border-color pb-2">
                    <Hash className="w-4 h-4 text-accent-purple" />
                    <span>Hashes ({iocs.hashes.length})</span>
                  </h3>
                  <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {iocs.hashes.map((hash, i) => (
                      <li key={i} className="text-xs font-mono text-text-secondary bg-bg-panel p-2 rounded break-all border border-border-color hover:border-accent-purple/50 transition-colors flex justify-between items-start group">
                        <span className="mr-2">{hash}</span>
                        <a href={`https://www.virustotal.com/gui/file/${hash}`} target="_blank" rel="noreferrer" title="Check on VirusTotal" className="text-text-muted hover:text-accent-purple opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
