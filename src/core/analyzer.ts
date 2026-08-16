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

export function calculateRiskScore(email: AnalyzedEmail): { riskScore: number, justification: string[] } {
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
  // Domain mismatches (P1 Return-Path vs P2 From)
  const fromDomain = email.from?.address?.includes('@') ? email.from.address.split('@')[1]?.toLowerCase() : '';
  const returnPathDomain = email.returnPath ? (email.returnPath.includes('@') ? email.returnPath.split('@')[1]?.toLowerCase() : email.returnPath.toLowerCase()) : '';
  
  if (fromDomain && returnPathDomain && fromDomain !== returnPathDomain) {
    score += 20; // P1 (Return-Path) and P2 (From) mismatch
    justification.push(`P1/P2 Sender Mismatch: Visible 'From' (${fromDomain}) does not match envelope 'Return-Path' (${returnPathDomain}) (+20)`);
  }
  
  if (email.replyTo.length > 0 && email.from && fromDomain) {
    const replyToDomain = email.replyTo[0].address?.includes('@') ? email.replyTo[0].address.split('@')[1]?.toLowerCase() : '';
    if (replyToDomain && replyToDomain !== fromDomain) {
      score += 25; // Reply-To mismatch
      justification.push(`'Reply-To' domain (${replyToDomain}) does not match 'From' domain (${fromDomain}) (+25)`);
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

  // Content Analysis findings
  if (email.contentAnalysis) {
    const ca = email.contentAnalysis;
    if (ca.suspiciousFormCount > 0) {
      score += 40;
      justification.push(`Credential harvesting form(s) detected in HTML body (+40)`);
    }
    if (ca.embeddedScriptCount > 0) {
      score += 35;
      justification.push(`Embedded scripts or encoded payloads in HTML (+35)`);
    }
    if (ca.hiddenTextCount > 0) {
      score += 15;
      justification.push(`Hidden text detected in HTML body (+15)`);
    }
    if (ca.trackingPixelCount > 0) {
      score += 5;
      justification.push(`Tracking pixel(s) detected (+5)`);
    }
  }

  // Domain Impersonation findings
  if (email.domainAnalysis) {
    const da = email.domainAnalysis;
    if (da.displayNameSpoofCount > 0) {
      score += 45;
      justification.push(`Display Name Brand Impersonation detected (+45)`);
    }
    if (da.homographCount > 0) {
      score += 45;
      justification.push(`Homograph/IDN impersonation attack detected (+45)`);
    }
    if (da.typosquatCount > 0) {
      score += 30;
      justification.push(`Typosquatting domain detected (+30)`);
    }
    if (da.subdomainAbuseCount > 0) {
      score += 25;
      justification.push(`Subdomain brand abuse detected (+25)`);
    }
    if (da.comboSquatCount > 0) {
      score += 20;
      justification.push(`Combo-squatting domain detected (+20)`);
    }
    if (da.punycodeCount > 0) {
      score += 15;
      justification.push(`Punycode/IDN domain detected (+15)`);
    }
  }

  if (score === 0) {
    justification.push('No immediate threats detected by heuristic engine.');
  }

  return { riskScore: Math.min(score, 100), justification };
}
