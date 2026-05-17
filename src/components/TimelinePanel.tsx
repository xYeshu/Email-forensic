import { useState } from 'react';
import { Route, ChevronDown, ChevronUp, Server, ArrowRight } from 'lucide-react';
import type { AnalyzedEmail } from '../types';
import { InfoTooltip } from './InfoTooltip';

export function TimelinePanel({ email }: { email: AnalyzedEmail }) {
  const [expanded, setExpanded] = useState(true);

  if (email.received.length === 0) return null;

  return (
    <div className="bg-bg-card border border-border-color rounded-xl shadow-lg mb-6">
      <div 
        className={`px-6 py-4 flex items-center justify-between bg-bg-panel cursor-pointer border-border-color ${expanded ? 'border-b rounded-t-xl' : 'rounded-xl'}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <Route className="w-6 h-6 text-accent-green" />
          <h2 className="text-xl font-semibold text-text-primary flex items-center">
            Delivery Timeline (Received Hops)
            <InfoTooltip content={
              <div className="space-y-2">
                <p><strong>Relevance:</strong> Shows the exact path an email took across the internet.</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Hop 1:</strong> Usually reveals the true originating IP address.</li>
                  <li><strong>Mismatches:</strong> Can indicate spoofed sending domains.</li>
                  <li><strong>Delays:</strong> High delays may indicate security queues or malicious holds.</li>
                </ul>
              </div>
            } />
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="px-3 py-1 bg-bg-dark rounded-full text-xs font-medium text-text-secondary border border-border-color">
            {email.received.length} Hops
          </div>
          {expanded ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
        </div>
      </div>

      {expanded && (
        <div className="p-6">

          <div className="relative border-l-2 border-border-color ml-4 space-y-8">
            {email.received.map((hop, i) => (
              <div key={i} className="relative pl-8">
                <div className="absolute -left-3.5 top-1 w-7 h-7 bg-bg-dark border-2 border-accent-green rounded-full flex items-center justify-center text-xs font-bold text-accent-green">
                  {hop.hop}
                </div>
                
                <div className="bg-bg-panel border border-border-color rounded-lg p-4 transition-colors hover:border-accent-green/50">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-4">
                    <div className="flex items-center space-x-3 text-sm flex-wrap gap-y-2">
                      <div className="flex items-center space-x-2 text-text-secondary">
                        <Server className="w-4 h-4" />
                        <span className="font-mono bg-bg-dark px-2 py-1 rounded border border-border-color max-w-[200px] truncate" title={hop.from}>{hop.from}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-text-muted" />
                      <div className="flex items-center space-x-2 text-text-primary">
                        <Server className="w-4 h-4 text-accent-green" />
                        <span className="font-mono bg-bg-dark px-2 py-1 rounded border border-border-color max-w-[200px] truncate" title={hop.by}>{hop.by}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {hop.formattedDelay && (
                        <div className="text-xs text-accent-orange font-mono bg-accent-orange/10 px-2 py-1 rounded border border-accent-orange/20" title="Delay from previous hop">
                          +{hop.formattedDelay}
                        </div>
                      )}
                      <div className="text-xs text-text-secondary bg-bg-dark px-3 py-1 rounded-full border border-border-color inline-block lg:w-auto w-fit">
                        {hop.date || 'Unknown Date'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    {hop.ip && (
                      <div className="col-span-1 md:col-span-3 mb-2 flex items-center space-x-2">
                        <span className="text-text-muted">Extracted IP:</span>
                        <span className="font-mono text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded border border-accent-cyan/20">{hop.ip}</span>
                        {hop.hop === 1 && (
                           <span className="text-xs text-accent-red font-bold ml-2">(Likely Originating IP)</span>
                        )}
                      </div>
                    )}
                    <div>
                      <span className="text-text-muted mr-2">With:</span>
                      <span className="font-mono text-text-secondary">{hop.with}</span>
                    </div>
                    {hop.id && (
                      <div className="md:col-span-2">
                        <span className="text-text-muted mr-2">ID:</span>
                        <span className="font-mono text-text-secondary">{hop.id}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
