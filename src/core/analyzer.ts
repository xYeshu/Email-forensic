import type { AnalyzedEmail, IOCs } from '../types';

export function extractIOCs(content: string): IOCs {
  const iocs: IOCs = {
    urls: [],
    domains: [],
    ips: [],
    emails: [],
    hashes: [],
    keywords: []
  };

  // Regex patterns
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  const ipRegex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
  const hashRegex = /\b[A-Fa-f0-9]{32}\b|\b[A-Fa-f0-9]{40}\b|\b[A-Fa-f0-9]{64}\b/g;

  // Extract from content
  const urls = content.match(urlRegex) || [];
  const ips = content.match(ipRegex) || [];
  const emails = content.match(emailRegex) || [];
  const hashes = content.match(hashRegex) || [];

  // Deduplicate and populate
  iocs.urls = Array.from(new Set(urls));
  iocs.ips = Array.from(new Set(ips));
  iocs.emails = Array.from(new Set(emails));
  iocs.hashes = Array.from(new Set(hashes));

  // Extract domains from URLs and Emails
  const domains = new Set<string>();
  iocs.urls.forEach(url => {
    try {
      const urlObj = new URL(url);
      domains.add(urlObj.hostname);
    } catch (e) {
      // Ignore invalid URLs
    }
  });
  iocs.emails.forEach(email => {
    const parts = email.split('@');
    if (parts.length === 2) domains.add(parts[1]);
  });
  iocs.domains = Array.from(domains);

  // Suspicious keywords
  const suspiciousKeywords = [
    'urgent', 'password', 'login', 'verify', 'account', 'suspended', 'update',
    'invoice', 'payment', 'transfer', 'wire', 'bank', 'secure', 'alert', 'validate',
    'wallet', 'seed', 'phrase'
  ];
  
  const contentLower = content.toLowerCase();
  suspiciousKeywords.forEach(kw => {
    if (contentLower.includes(kw)) {
      iocs.keywords.push(kw);
    }
  });

  return iocs;
}

export function analyzeHeaders(headers: Record<string, string | string[]>) {
  const anomalies = [];
  
  // Basic checks
  if (!headers['message-id']) anomalies.push('Missing Message-ID header');
  if (!headers['date']) anomalies.push('Missing Date header');
  
  return anomalies;
}

export function calculateRiskScore(email: AnalyzedEmail): { riskScore: number, threatLevel: 'Safe' | 'Suspicious' | 'Malicious' | 'Unknown', justification: string[] } {
  let score = 0;
  const justification: string[] = [];

  // Authentication failures
  if (email.authResults.spf === 'Fail') {
    score += 30;
    justification.push('SPF Authentication Failed (+30)');
  }
  if (email.authResults.dkim === 'Fail') {
    score += 30;
    justification.push('DKIM Authentication Failed (+30)');
  }
  if (email.authResults.dmarc === 'Fail') {
    score += 40;
    justification.push('DMARC Authentication Failed (+40)');
  }

  // Attachments
  const hasSuspiciousAttachment = email.attachments.some(a => a.isSuspicious);
  if (hasSuspiciousAttachment) {
    score += 50;
    justification.push('Suspicious or Executable Attachment Detected (+50)');
  }

  // Domain mismatches
  const fromDomain = email.from?.address.split('@')[1];
  const returnPathStr = typeof email.headers['return-path'] === 'string' ? email.headers['return-path'] : '';
  const returnMatch = returnPathStr.match(/<.*?@(.*?)>/);
  if (fromDomain && returnMatch && returnMatch[1] !== fromDomain) {
    score += 20; // From and Return-Path mismatch
    justification.push(`'From' domain does not match 'Return-Path' domain (+20)`);
  }
  
  if (email.replyTo.length > 0 && email.from) {
    const replyToDomain = email.replyTo[0].address.split('@')[1];
    if (replyToDomain && replyToDomain !== fromDomain) {
      score += 25; // Reply-To mismatch
      justification.push(`'Reply-To' domain does not match 'From' domain (+25)`);
    }
  }

  // Suspicious Keywords
  if (email.iocs.keywords.length > 3) {
    score += 15;
    justification.push(`Multiple suspicious keywords detected (+15)`);
  } else if (email.iocs.keywords.length > 0) {
    score += 5;
    justification.push(`Suspicious keyword detected (+5)`);
  }

  // Suspicious URLs / IPs
  if (email.iocs.urls.length > 5) {
    score += 10;
    justification.push('High volume of URLs detected (+10)');
  }

  let threatLevel: 'Safe' | 'Suspicious' | 'Malicious' | 'Unknown' = 'Unknown';
  if (score >= 80) threatLevel = 'Malicious';
  else if (score >= 40) threatLevel = 'Suspicious';
  else threatLevel = 'Safe';

  if (score === 0) {
    justification.push('No immediate threats detected by heuristic engine.');
  }

  return { riskScore: Math.min(score, 100), threatLevel, justification };
}
