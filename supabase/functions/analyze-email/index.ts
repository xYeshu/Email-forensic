// supabase/functions/analyze-email/index.ts
// Supabase Edge Function — Proxies email analysis requests to Gemini API
// The API key and system prompt live ONLY here (server-side, never exposed to the client)

import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.24.1";

// --- CORS Configuration ---
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// --- Rate Limiting (in-memory, per-instance) ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10; // max requests
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // per 1 minute

function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientIp);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return true;
  }

  return false;
}

// --- Allowed Gemini Models (whitelist to prevent abuse) ---
const ALLOWED_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite",
];

// --- System Prompt (lives ONLY server-side) ---
function buildPrompt(email: EmailPayload): string {
  return `
  You are a highly experienced SOC Level 3 Analyst specializing in email forensics, phishing analysis and email infrastructure.
  Analyze the following email metadata, indicators of compromise, and content.
  
  Format your response STRICTLY as a JSON object matching this schema, with no markdown code blocks formatting (just pure JSON):
  {
    "summary": "High-level executive summary of what this email is and its intent",
    "verdict": "Safe" | "Suspicious" | "Malicious",
    "confidence": number from 0 to 100,
    "explanation": "Super Detailed SOC-style explanation of why you reached this verdict, analyzing headers, content, and authentication results",
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
  From: ${email.fromAddress || 'Unknown'}
  To: ${email.toAddresses || 'Unknown'}
  Date: ${email.date}
  Message-ID: ${email.messageId}
  
  Authentication Results:
  SPF: ${email.authResults.spf}
  DKIM: ${email.authResults.dkim}
  DMARC: ${email.authResults.dmarc}
  
  Body Content:
  ${(email.body || '').substring(0, 3000)}
  
  Extracted IOCs:
  URLs: ${(email.iocs.urls || []).join(', ')}
  IPs: ${(email.iocs.ips || []).join(', ')}
  Domains: ${(email.iocs.domains || []).join(', ')}
  
  Suspicious Keywords found: ${(email.iocs.keywords || []).join(', ')}
  
  Attachments:
  ${(email.attachments || []).map((a: { filename: string; isSuspicious: boolean }) => `- ${a.filename} (Suspicious: ${a.isSuspicious})`).join('\n')}
  `;
}

// --- Types ---
interface EmailPayload {
  subject: string;
  fromAddress: string;
  toAddresses: string;
  date: string;
  messageId: string;
  authResults: {
    spf: string;
    dkim: string;
    dmarc: string;
  };
  body: string;
  iocs: {
    urls: string[];
    ips: string[];
    domains: string[];
    keywords: string[];
  };
  attachments: { filename: string; isSuspicious: boolean }[];
  model?: string;
}

// --- Main Handler ---
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  // Rate limiting
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";

  if (isRateLimited(clientIp)) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Please wait before trying again." }),
      { status: 429, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  try {
    // Parse and validate request body
    const payload: EmailPayload = await req.json();

    if (!payload.subject && !payload.body && !payload.fromAddress) {
      return new Response(
        JSON.stringify({ error: "Invalid request: missing email data" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Validate model selection against whitelist
    const requestedModel = payload.model || "gemini-2.5-flash";
    const modelName = ALLOWED_MODELS.includes(requestedModel)
      ? requestedModel
      : "gemini-2.5-flash";

    // Get API key from Supabase secrets (NEVER exposed to client)
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error("GEMINI_API_KEY secret is not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Build prompt and call Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = buildPrompt(payload);

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Clean up potential markdown code block artifacts
    const cleanedText = text
      .replace(/```json\n/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanedText);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (error) {
    // Sanitized error — never leak API key or internal details
    const message =
      error instanceof SyntaxError
        ? "Failed to parse AI response. Try a different model."
        : "Analysis failed. Please try again or switch models.";

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
