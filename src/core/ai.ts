import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AnalyzedEmail, AIAnalysisResult } from '../types';

export async function analyzeWithAI(email: AnalyzedEmail, modelName: string = 'gemini-2.5-flash'): Promise<AIAnalysisResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Please set VITE_GEMINI_API_KEY in your environment variables.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });
  
  const prompt = `
  You are a highly experienced SOC Level 3 Analyst specializing in email forensics, phishing analysis and email infrastructure.
  Analyze the following email metadata, indicators of compromise, and content.
  
  Format your response STRICTLY as a JSON object matching this schema, with no markdown code blocks formatting (just pure JSON):
  {
    "summary": "High-level executive summary of what this email is and its intent",
    "verdict": "Safe" | "Suspicious" | "Malicious",
    "confidence": number from 0 to 100,
    "explanation": "Detailed SOC-style explanation of why you reached this verdict, analyzing headers, content, and authentication results",
    "phishingTechniques": ["list of identified techniques like 'Impersonation', 'Urgency', 'Credential Harvesting'"],
    "remediation": ["Actionable steps for the Client, e.g., 'Block domain X on firewall', 'Purge mail from the users mailbox','Reset user password'"],
    "networkIndicators": ["Any suspicious domains, IPs, or URLs extracted or identified"],
    "residualRisk": {
      "rating": "Low" | "Medium" | "High" | "Critical",
      "justification": "A detailed paragraph explaining the residual risk rating. Depending on the context, we cant always conclude that an email is completely safe simply because no malicious indicators were found. Eg. Even if SPF, DKIM, and DMARC all pass, a legitimate sender may have been compromised. Always explain what residual risk still exists based on the available evidence.",
      "items": [
        {
          "risk": "Short risk title",
          "detail": "Detailed explanation of this specific residual risk"
        }
      ]
    },
    "cannotVerify": [
      "A list of things that CANNOT be verified from the .eml file alone. For example: 'Whether the sender account has been compromised', 'Whether linked files are malicious without sandboxed execution', 'Whether the recipient has already interacted with the email', 'Whether similar emails were sent to other recipients'. Be specific and contextual to this particular email. If the email contains file attachments or file-sharing links from a legitimate sender, state that file safety cannot be confirmed from email artifacts alone. If a feature or evidence is unavailable, explicitly state that the conclusion cannot be made from the provided .eml file alone."
    ]
  }

  IMPORTANT INSTRUCTIONS FOR RESIDUAL RISK:
  - A legitimate sender account or trusted infrastructure can be compromised while still passing SPF, DKIM, and DMARC validation.
  - Because analysis is limited to the supplied email artifacts, a residual level of risk might sometimes remain depending on the email.
  - Consider risks such as: sender account compromise, users already interacting with the email, credentials already being compromised, links remaining active, similar phishing campaigns continuing, sender infrastructure still being operational, and additional users having received similar emails.

  IMPORTANT INSTRUCTIONS FOR CANNOT VERIFY:
  - This section must explicitly state investigative limitations of email-only forensic analysis.
  - State clearly what cannot be determined from the .eml file alone.
  - Be contextual: if attachments exist, mention that file safety cannot be confirmed without sandboxed execution. If URLs exist, mention that destination safety cannot be confirmed without live analysis. If the sender appears legitimate, mention that account compromise cannot be ruled out from email artifacts alone.

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
    throw new Error('Failed to analyze email with AI. Try switching the model');
  }
}
