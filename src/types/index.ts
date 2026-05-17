export interface AnalyzedEmail {
  headers: Record<string, string | string[]>;
  from: EmailAddress | null;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  subject: string;
  body: string;
  html: string;
  attachments: AttachmentInfo[];
  messageId: string;
  replyTo: EmailAddress[];
  returnPath: string;
  received: ReceivedHop[];
  date: string;
  
  iocs: IOCs;
  authResults: AuthResults;
  riskScore: number;
  threatLevel: 'Safe' | 'Suspicious' | 'Malicious' | 'Unknown';
  justification?: string[];
}

export interface EmailAddress {
  name: string;
  address: string;
}

export interface AttachmentInfo {
  filename: string;
  mimeType: string;
  size: number;
  content: ArrayBuffer;
  hash?: string;
  isSuspicious: boolean;
  suspiciousReasons: string[];
}

export interface ReceivedHop {
  hop: number;
  from: string;
  by: string;
  with: string;
  id?: string;
  date: string;
  delay?: number;
  formattedDelay?: string;
  ip?: string;
}

export interface IOCs {
  urls: string[];
  domains: string[];
  ips: string[];
  emails: string[];
  hashes: string[];
  keywords: string[];
}

export interface AuthResults {
  spf: string;
  dkim: string;
  dmarc: string;
  raw: string;
}

export interface AIAnalysisResult {
  summary: string;
  verdict: 'Safe' | 'Suspicious' | 'Malicious';
  confidence: number;
  explanation: string;
  phishingTechniques: string[];
  remediation: string[];
  networkIndicators: string[];
}
