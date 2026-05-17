import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AnalyzedEmail, AIAnalysisResult } from '../types';

export async function analyzeWithAI(email: AnalyzedEmail): Promise<AIAnalysisResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Please set VITE_GEMINI_API_KEY in your environment variables.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); // Using a solid standard model
  
  const prompt = `
  You are an experinced SOC Level 3 Analyst specializing in email forensics, phishing analysis and email Infrastructure
  Analyze the following email metadata, indicators of compromise, and content.
  
  Format your response STRICTLY as a JSON object matching this schema, with no markdown code blocks formatting (just pure JSON):
  {
    "summary": "High-level executive summary of what this email is and its intent",
    "verdict": "Safe" | "Suspicious" | "Malicious",
    "confidence": number from 0 to 100,
    "explanation": "Detailed SOC-style explanation of why you reached this verdict, analyzing headers, content, and authentication results",
    "phishingTechniques": ["list of identified techniques like 'Impersonation', 'Urgency', 'Credential Harvesting'"],
    "remediation": ["Actionable steps for the SOC or user, e.g., 'Block domain X on firewall', 'Reset user password'"],
    "networkIndicators": ["Any suspicious domains, IPs, or URLs extracted or identified"]
  }

  Here is the email data:
  Subject: ${email.subject}
  From: ${email.from?.address || 'Unknown'}
  To: ${email.to.map(t => t.address).join(', ')}
  Date: ${email.date}
  Message-ID: ${email.messageId}
  
  Authentication Results:
  SPF: ${email.authResults.spf}
  DKIM: ${email.authResults.dkim}
  DMARC: ${email.authResults.dmarc}
  
  Body Content:
  ${email.body.substring(0, 3000)} // Limiting size to avoid token issues
  
  Extracted IOCs:
  URLs: ${email.iocs.urls.join(', ')}
  IPs: ${email.iocs.ips.join(', ')}
  Domains: ${email.iocs.domains.join(', ')}
  
  Suspicious Keywords found: ${email.iocs.keywords.join(', ')}
  
  Attachments:
  ${email.attachments.map(a => `- ${a.filename} (Suspicious: ${a.isSuspicious})`).join('\n')}
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Clean up potential markdown code block artifacts
    const cleanedText = text.replace(/```json\n/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText) as AIAnalysisResult;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    throw new Error('Failed to analyze email with AI. Check API key and network connection.');
  }
}
