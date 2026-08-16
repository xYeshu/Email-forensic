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
  contentAnalysis: ContentAnalysis;
  domainAnalysis: DomainAnalysis;
  rawEml?: string;
  riskScore: number;
  justification?: string[];
}

export interface DomainFinding {
  type: 'homograph' | 'punycode' | 'typosquat' | 'subdomain-abuse' | 'combosquat' | 'display-name-spoof';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  brand: string;
  legitimateDomain: string;
  suspiciousDomain: string;
  title: string;
  description: string;
  confidence: number;  // 0-100
  technique: string;
}

export interface DomainAnalysis {
  findings: DomainFinding[];
  senderDomain: string;
  isExactBrandMatch: boolean;
  targetedBrands: string[];
  homographCount: number;
  punycodeCount: number;
  typosquatCount: number;
  subdomainAbuseCount: number;
  comboSquatCount: number;
  displayNameSpoofCount: number;
}

export type ContentFindingSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface ContentFinding {
  type: 'hidden-text' | 'tracking-pixel' | 'suspicious-form' | 'embedded-script' | 'encoded-content' | 'data-uri';
  severity: ContentFindingSeverity;
  title: string;
  description: string;
  evidence: string; // Snippet of the offending HTML/CSS
  mitreTactic?: string;
}

export interface ContentAnalysis {
  findings: ContentFinding[];
  hiddenTextCount: number;
  trackingPixelCount: number;
  suspiciousFormCount: number;
  embeddedScriptCount: number;
  overallRisk: ContentFindingSeverity;
  hasHtml: boolean;
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

export interface ResidualRiskItem {
  risk: string;
  detail: string;
}

export interface AIAnalysisResult {
  summary: string;
  verdict: 'Safe' | 'Suspicious' | 'Malicious';
  confidence: number;
  explanation: string;
  phishingTechniques: string[];
  remediation: string[];
  networkIndicators: string[];
  residualRisk: {
    rating: 'Low' | 'Medium' | 'High' | 'Critical';
    justification: string;
    items: ResidualRiskItem[];
  };
  cannotVerify: string[];
}
