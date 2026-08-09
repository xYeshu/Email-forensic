import type { AnalyzedEmail, AIAnalysisResult } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function analyzeWithAI(email: AnalyzedEmail, modelName: string = 'gemini-2.5-flash'): Promise<AIAnalysisResult> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
  }

  // Build the payload — send only structured email data, NOT the prompt
  const payload = {
    subject: email.subject,
    fromAddress: email.from?.address || 'Unknown',
    toAddresses: email.to.map(t => t.address).join(', '),
    date: email.date,
    messageId: email.messageId,
    authResults: {
      spf: email.authResults.spf,
      dkim: email.authResults.dkim,
      dmarc: email.authResults.dmarc,
    },
    body: email.body.substring(0, 3000),
    iocs: {
      urls: email.iocs.urls,
      ips: email.iocs.ips,
      domains: email.iocs.domains,
      keywords: email.iocs.keywords,
    },
    attachments: email.attachments.map(a => ({
      filename: a.filename,
      isSuspicious: a.isSuspicious,
    })),
    model: modelName,
  };

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/analyze-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Server responded with status ${response.status}`;
      throw new Error(errorMessage);
    }

    const result: AIAnalysisResult = await response.json();
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to analyze email. Please try again or switch models.');
  }
}
