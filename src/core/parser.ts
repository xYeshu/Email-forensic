import PostalMime from 'postal-mime';
import type { AnalyzedEmail, EmailAddress, AttachmentInfo, ReceivedHop, AuthResults } from '../types';
import { calculateHash } from '../lib/utils';
import { extractIOCs, calculateRiskScore } from './analyzer';
import { analyzeContent } from './contentAnalyzer';
import { analyzeDomains } from './domainAnalyzer';

export async function parseEmlFile(file: File): Promise<AnalyzedEmail> {
  const arrayBuffer = await file.arrayBuffer();
  const parser = new PostalMime();
  const email = await parser.parse(arrayBuffer as any);

  // Process headers into a map
  const headerMap: Record<string, string | string[]> = {};
  if (email.headers) {
    for (const h of email.headers) {
      const key = h.key.toLowerCase();
      if (headerMap[key]) {
        if (Array.isArray(headerMap[key])) {
          (headerMap[key] as string[]).push(h.value);
        } else {
          headerMap[key] = [headerMap[key] as string, h.value];
        }
      } else {
        headerMap[key] = h.value;
      }
    }
  }

  // Parse Auth Results
  const authResults: AuthResults = {
    spf: 'None',
    dkim: 'None',
    dmarc: 'None',
    raw: ''
  };
  const authHeader = headerMap['authentication-results'];
  if (authHeader) {
    const raw = Array.isArray(authHeader) ? authHeader.join('; ') : authHeader;
    authResults.raw = raw;
    if (raw.toLowerCase().includes('spf=pass')) authResults.spf = 'Pass';
    else if (raw.toLowerCase().includes('spf=fail') || raw.toLowerCase().includes('spf=softfail')) authResults.spf = 'Fail';
    
    if (raw.toLowerCase().includes('dkim=pass')) authResults.dkim = 'Pass';
    else if (raw.toLowerCase().includes('dkim=fail')) authResults.dkim = 'Fail';
    
    if (raw.toLowerCase().includes('dmarc=pass')) authResults.dmarc = 'Pass';
    else if (raw.toLowerCase().includes('dmarc=fail')) authResults.dmarc = 'Fail';
  }

  // Process attachments
  const attachments: AttachmentInfo[] = [];
  if (email.attachments && email.attachments.length > 0) {
    for (const att of email.attachments) {
      const rawContent = att.content;
      
      let byteLength = 0;
      let arrayBuf: ArrayBuffer = new ArrayBuffer(0);
      
      if (typeof rawContent === 'string') {
          const encoder = new TextEncoder();
          const uint8Array = encoder.encode(rawContent);
          arrayBuf = uint8Array.buffer as ArrayBuffer;
          byteLength = uint8Array.byteLength;
      } else if (rawContent instanceof Uint8Array) {
          arrayBuf = rawContent.buffer as ArrayBuffer;
          byteLength = rawContent.byteLength;
      } else if (rawContent instanceof ArrayBuffer) {
          arrayBuf = rawContent;
          byteLength = rawContent.byteLength;
      }

      const hash = await calculateHash(arrayBuf);
      
      const filename = att.filename || 'unknown_attachment';
      const ext = filename.split('.').pop()?.toLowerCase() || '';
      const execExts = ['exe', 'bat', 'cmd', 'ps1', 'vbs', 'jar', 'msi', 'scr', 'pif', 'com', 'js', 'wsf'];
      const docMacroExts = ['docm', 'xlsm', 'pptm'];
      
      let isSuspicious = false;
      const reasons: string[] = [];
      
      if (execExts.includes(ext)) {
        isSuspicious = true;
        reasons.push('Executable extension');
      }
      if (docMacroExts.includes(ext)) {
        isSuspicious = true;
        reasons.push('Macro-enabled document');
      }
      if ((filename.match(/\./g) || []).length > 1) {
        isSuspicious = true;
        reasons.push('Double extension detected');
      }

      attachments.push({
        filename,
        mimeType: att.mimeType,
        size: byteLength,
        content: arrayBuf,
        hash,
        isSuspicious,
        suspiciousReasons: reasons
      });
    }
  }

  // Parse Received headers for hops
  const receivedHops: ReceivedHop[] = [];
  const receivedHeaders = headerMap['received'];
  if (receivedHeaders) {
    const arr = Array.isArray(receivedHeaders) ? receivedHeaders : [receivedHeaders];
    let previousDate: Date | null = null;
    
    arr.reverse().forEach((header, index) => {
      // Basic heuristic parsing
      const fromMatch = header.match(/from\s+([^;\n]+)/i);
      const byMatch = header.match(/by\s+([^;\n]+)/i);
      const withMatch = header.match(/with\s+([^;\n]+)/i);
      const idMatch = header.match(/id\s+([^;\n]+)/i);
      const dateSplit = header.split(';');
      const dateStr = dateSplit.length > 1 ? dateSplit.slice(1).join(';').trim() : '';
      
      let ipMatch = header.match(/\[([0-9a-fA-F:\.]+)\]/);
      if (!ipMatch && fromMatch) {
        ipMatch = fromMatch[1].match(/([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/);
      }
      
      let delay = 0;
      let formattedDelay = '';
      if (dateStr) {
        const currentDate = new Date(dateStr);
        if (!isNaN(currentDate.getTime()) && previousDate && !isNaN(previousDate.getTime())) {
           delay = currentDate.getTime() - previousDate.getTime();
           if (delay >= 0) {
              const seconds = Math.floor(delay / 1000);
              formattedDelay = seconds > 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`;
           } else {
              formattedDelay = "Time skewed";
           }
        }
        previousDate = currentDate;
      }

      receivedHops.push({
        hop: index + 1,
        from: fromMatch ? fromMatch[1].trim() : 'Unknown',
        by: byMatch ? byMatch[1].trim() : 'Unknown',
        with: withMatch ? withMatch[1].trim() : 'Unknown',
        id: idMatch ? idMatch[1].trim() : 'Unknown',
        date: dateStr,
        ip: ipMatch ? ipMatch[1] : undefined,
        delay,
        formattedDelay
      });
    });
  }

  // Combine body and HTML for IOC extraction
  const fullContent = (email.subject || '') + '\n' + (email.text || '') + '\n' + (email.html || '');
  const iocs = extractIOCs(fullContent);

  const from: EmailAddress | null = email.from ? { name: email.from.name || '', address: email.from.address || '' } : null;
  const to = (email.to || []).map(t => ({ name: t.name || '', address: t.address || '' }));
  
  const replyToRaw = headerMap['reply-to'];
  const replyTo: EmailAddress[] = [];
  if (replyToRaw) {
      const arr = Array.isArray(replyToRaw) ? replyToRaw : [replyToRaw];
      arr.forEach(r => {
          // crude parse just for simplicity
          const match = r.match(/<([^>]+)>/);
          if (match) replyTo.push({ name: r.replace(match[0], '').trim(), address: match[1] });
          else replyTo.push({ name: '', address: r.trim() });
      });
  }

  // Run deep HTML content analysis
  const contentAnalysis = analyzeContent(email.html || '');

  // Run domain impersonation / typosquatting analysis
  const senderDomain = from?.address?.split('@')[1] || '';
  const domainAnalysis = analyzeDomains(senderDomain, iocs.domains, iocs.urls);

  const analyzed: AnalyzedEmail = {
    headers: headerMap,
    from,
    to,
    cc: (email.cc || []).map(c => ({ name: c.name || '', address: c.address || '' })),
    bcc: (email.bcc || []).map(b => ({ name: b.name || '', address: b.address || '' })),
    subject: email.subject || '(No Subject)',
    body: email.text || '',
    html: email.html || '',
    attachments,
    messageId: email.messageId || (headerMap['message-id'] as string) || '',
    replyTo,
    returnPath: (headerMap['return-path'] as string) || '',
    received: receivedHops,
    date: email.date || '',
    iocs,
    authResults,
    contentAnalysis,
    domainAnalysis,
    riskScore: 0,
    justification: []
  };

  const { riskScore, justification } = calculateRiskScore(analyzed);
  analyzed.riskScore = riskScore;
  analyzed.justification = justification;

  return analyzed;
}
