import type { ContentAnalysis, ContentFinding, ContentFindingSeverity } from '../types';

/**
 * Deep HTML Content Analyzer for Email Forensics
 * 
 * Detects:
 * - Hidden text (display:none, visibility:hidden, font-size:0, zero-height, color tricks)
 * - Tracking pixels (1x1 images, beacon images)
 * - Suspicious <form> elements (credential harvesting)
 * - CSS tricks that hide content from filters but display to users
 * - Embedded/encoded scripts (javascript:, event handlers, data: URIs, base64)
 */

function truncateEvidence(html: string, maxLen = 200): string {
  const cleaned = html.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.substring(0, maxLen) + '…';
}

// ─── HIDDEN TEXT DETECTION ────────────────────────────────────────────────

function detectHiddenText(html: string): ContentFinding[] {
  const findings: ContentFinding[] = [];

  // display:none on elements with text content
  const displayNoneRegex = /<([a-z][a-z0-9]*)\b[^>]*style\s*=\s*["'][^"']*display\s*:\s*none[^"']*["'][^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = displayNoneRegex.exec(html)) !== null) {
    const textContent = match[2].replace(/<[^>]+>/g, '').trim();
    if (textContent.length > 0) {
      findings.push({
        type: 'hidden-text',
        severity: 'high',
        title: 'Hidden Text (display:none)',
        description: `A <${match[1]}> element with display:none contains text content. This is a common technique used to bypass text-based email filters while hiding content from the recipient, or to inject invisible text for anti-analysis purposes.`,
        evidence: truncateEvidence(match[0]),
        mitreTactic: 'T1036 — Masquerading'
      });
    }
  }

  // visibility:hidden
  const visHiddenRegex = /<([a-z][a-z0-9]*)\b[^>]*style\s*=\s*["'][^"']*visibility\s*:\s*hidden[^"']*["'][^>]*>([\s\S]*?)<\/\1>/gi;
  while ((match = visHiddenRegex.exec(html)) !== null) {
    const textContent = match[2].replace(/<[^>]+>/g, '').trim();
    if (textContent.length > 0) {
      findings.push({
        type: 'hidden-text',
        severity: 'high',
        title: 'Hidden Text (visibility:hidden)',
        description: `A <${match[1]}> element uses visibility:hidden to conceal text. The element still occupies space in the layout but is invisible to the user. Hidden content may be used to bypass spam filters or embed tracking markers.`,
        evidence: truncateEvidence(match[0]),
        mitreTactic: 'T1036 — Masquerading'
      });
    }
  }

  // font-size: 0 or font-size:0px / 0pt / 0em
  const fontSizeZeroRegex = /<([a-z][a-z0-9]*)\b[^>]*style\s*=\s*["'][^"']*font-size\s*:\s*0(?:px|pt|em|rem|%)?\b[^"']*["'][^>]*>([\s\S]*?)<\/\1>/gi;
  while ((match = fontSizeZeroRegex.exec(html)) !== null) {
    const textContent = match[2].replace(/<[^>]+>/g, '').trim();
    if (textContent.length > 0) {
      findings.push({
        type: 'hidden-text',
        severity: 'high',
        title: 'Zero-Size Text (font-size:0)',
        description: `A <${match[1]}> element uses font-size:0 to render text invisible. This technique is commonly used in phishing emails to inject text that defeats email content scanners while remaining invisible to the reader.`,
        evidence: truncateEvidence(match[0]),
        mitreTactic: 'T1036 — Masquerading'
      });
    }
  }

  // Zero-height/width containers (overflow:hidden + height:0 or max-height:0)
  const zeroHeightRegex = /<([a-z][a-z0-9]*)\b[^>]*style\s*=\s*["'][^"']*(?:max-)?height\s*:\s*0(?:px)?\s*;[^"']*overflow\s*:\s*hidden[^"']*["'][^>]*>([\s\S]*?)<\/\1>/gi;
  while ((match = zeroHeightRegex.exec(html)) !== null) {
    const textContent = match[2].replace(/<[^>]+>/g, '').trim();
    if (textContent.length > 0) {
      findings.push({
        type: 'hidden-text',
        severity: 'medium',
        title: 'Zero-Height Container With Content',
        description: `A <${match[1]}> element has zero height with overflow:hidden, effectively hiding its contents. This can be used to smuggle content past filters.`,
        evidence: truncateEvidence(match[0]),
        mitreTactic: 'T1036 — Masquerading'
      });
    }
  }

  // Opacity: 0
  const opacityZeroRegex = /<([a-z][a-z0-9]*)\b[^>]*style\s*=\s*["'][^"']*opacity\s*:\s*0(?:\.0+)?(?:\s*;|\s*["'])[^>]*>([\s\S]*?)<\/\1>/gi;
  while ((match = opacityZeroRegex.exec(html)) !== null) {
    const textContent = match[2].replace(/<[^>]+>/g, '').trim();
    if (textContent.length > 0) {
      findings.push({
        type: 'hidden-text',
        severity: 'high',
        title: 'Invisible Content (opacity:0)',
        description: `A <${match[1]}> element with opacity:0 contains text content. Fully transparent elements are invisible to users but may be read by email parsers and filters.`,
        evidence: truncateEvidence(match[0]),
        mitreTactic: 'T1036 — Masquerading'
      });
    }
  }

  // Position offscreen (large negative left/top values)
  const offscreenRegex = /<([a-z][a-z0-9]*)\b[^>]*style\s*=\s*["'][^"']*(?:left|top|margin-left|margin-top)\s*:\s*-[1-9]\d{3,}px[^"']*["'][^>]*>([\s\S]*?)<\/\1>/gi;
  while ((match = offscreenRegex.exec(html)) !== null) {
    const textContent = match[2].replace(/<[^>]+>/g, '').trim();
    if (textContent.length > 0) {
      findings.push({
        type: 'hidden-text',
        severity: 'medium',
        title: 'Off-Screen Positioned Content',
        description: `A <${match[1]}> element is positioned far off-screen using large negative positioning values. This is a technique to hide content from the user while keeping it in the DOM.`,
        evidence: truncateEvidence(match[0]),
        mitreTactic: 'T1036 — Masquerading'
      });
    }
  }

  return findings;
}

// ─── TRACKING PIXEL DETECTION ─────────────────────────────────────────────

function detectTrackingPixels(html: string): ContentFinding[] {
  const findings: ContentFinding[] = [];
  let match;

  // 1x1 images or very small images
  const tinyImgRegex = /<img\b[^>]*(?:width\s*=\s*["']?(?:0|1)["']?\s|height\s*=\s*["']?(?:0|1)["']?\s)[^>]*>/gi;
  while ((match = tinyImgRegex.exec(html)) !== null) {
    const srcMatch = match[0].match(/src\s*=\s*["']([^"']+)["']/i);
    const src = srcMatch ? srcMatch[1] : 'unknown';
    findings.push({
      type: 'tracking-pixel',
      severity: 'medium',
      title: 'Tracking Pixel Detected (1×1 Image)',
      description: `A 1×1 pixel image was detected. Tracking pixels are used to confirm email opens, capture IP addresses, and fingerprint the recipient's email client. Source: ${truncateEvidence(src, 100)}`,
      evidence: truncateEvidence(match[0]),
      mitreTactic: 'T1598 — Phishing for Information'
    });
  }

  // Images with common tracking pixel patterns in URLs
  const trackingUrlPatterns = [
    /track/i, /pixel/i, /beacon/i, /open\./i, /wf\.gif/i,
    /spacer\.gif/i, /blank\.gif/i, /\.gif\?.*(?:id|uid|email|hash|token)/i,
    /mail\.google\.com\/mail\/u\/.*\/images/i,
    /mailtrack/i, /readnotify/i
  ];

  const allImgRegex = /<img\b[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi;
  while ((match = allImgRegex.exec(html)) !== null) {
    const src = match[1];
    for (const pattern of trackingUrlPatterns) {
      if (pattern.test(src)) {
        findings.push({
          type: 'tracking-pixel',
          severity: 'low',
          title: 'Potential Tracking Image',
          description: `An image URL matches known tracking pixel patterns (${pattern.source}). This may be used to track email opens and gather recipient metadata.`,
          evidence: truncateEvidence(match[0]),
          mitreTactic: 'T1598 — Phishing for Information'
        });
        break;
      }
    }
  }

  // Images styled to be invisible (display:none, opacity:0, etc.)
  const hiddenImgRegex = /<img\b[^>]*style\s*=\s*["'][^"']*(?:display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0)[^"']*["'][^>]*>/gi;
  while ((match = hiddenImgRegex.exec(html)) !== null) {
    findings.push({
      type: 'tracking-pixel',
      severity: 'medium',
      title: 'Hidden Image (Likely Tracking Beacon)',
      description: 'An image element is styled to be invisible. Hidden images that load external URLs are commonly used as tracking beacons to confirm email delivery and open events.',
      evidence: truncateEvidence(match[0]),
      mitreTactic: 'T1598 — Phishing for Information'
    });
  }

  return findings;
}

// ─── SUSPICIOUS FORM DETECTION ────────────────────────────────────────────

function detectSuspiciousForms(html: string): ContentFinding[] {
  const findings: ContentFinding[] = [];
  let match;

  // Any <form> element in an email is suspicious
  const formRegex = /<form\b[^>]*>([\s\S]*?)<\/form>/gi;
  while ((match = formRegex.exec(html)) !== null) {
    const formTag = match[0];
    const actionMatch = formTag.match(/action\s*=\s*["']([^"']+)["']/i);
    const methodMatch = formTag.match(/method\s*=\s*["']([^"']+)["']/i);
    const hasPasswordField = /type\s*=\s*["']password["']/i.test(formTag);
    const hasEmailField = /type\s*=\s*["']email["']/i.test(formTag);
    const hasTextField = /type\s*=\s*["']text["']/i.test(formTag);
    const hasSubmitButton = /<(?:input|button)[^>]*type\s*=\s*["']submit["'][^>]*>/i.test(formTag);

    let severity: ContentFindingSeverity = 'high';
    let title = 'Suspicious Form Element';
    let description = 'An HTML <form> element was detected in the email body. Forms in emails are highly unusual in legitimate correspondence and are a common credential harvesting technique.';

    if (hasPasswordField) {
      severity = 'critical';
      title = 'Credential Harvesting Form (Password Field)';
      description = 'A form containing a password input field was detected. This is a strong indicator of a credential harvesting phishing attack. The form is designed to capture user credentials directly from within the email.';
    } else if (hasEmailField && hasSubmitButton) {
      severity = 'critical';
      title = 'Credential Harvesting Form (Email + Submit)';
      description = 'A form with email input and submit button was detected. This pattern is commonly used in credential harvesting attacks where the attacker collects email addresses or login credentials.';
    } else if (hasTextField && hasSubmitButton) {
      severity = 'high';
      title = 'Data Collection Form';
      description = 'A form with text input fields and a submit button was detected. Forms embedded in emails can be used to exfiltrate sensitive information to an attacker-controlled server.';
    }

    if (actionMatch) {
      description += ` Form action URL: ${actionMatch[1]}`;
    }
    if (methodMatch) {
      description += ` Method: ${methodMatch[1].toUpperCase()}`;
    }

    findings.push({
      type: 'suspicious-form',
      severity,
      title,
      description,
      evidence: truncateEvidence(formTag, 300),
      mitreTactic: 'T1056.003 — Input Capture: Web Portal Capture'
    });
  }

  // Standalone password or input fields outside forms (also suspicious)
  if (!/<form\b/i.test(html)) {
    const standalonePasswordRegex = /<input\b[^>]*type\s*=\s*["']password["'][^>]*>/gi;
    while ((match = standalonePasswordRegex.exec(html)) !== null) {
      findings.push({
        type: 'suspicious-form',
        severity: 'critical',
        title: 'Standalone Password Input Field',
        description: 'A password input field was found outside of any form element. This may indicate an attempt to capture credentials using JavaScript or to present a fake login prompt to the user.',
        evidence: truncateEvidence(match[0]),
        mitreTactic: 'T1056.003 — Input Capture: Web Portal Capture'
      });
    }
  }

  return findings;
}


// ─── EMBEDDED SCRIPT / ENCODED CONTENT DETECTION ──────────────────────────

function detectEmbeddedScripts(html: string): ContentFinding[] {
  const findings: ContentFinding[] = [];
  let match;

  // <script> tags
  const scriptTagRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = scriptTagRegex.exec(html)) !== null) {
    findings.push({
      type: 'embedded-script',
      severity: 'critical',
      title: 'Embedded <script> Tag',
      description: 'A <script> element was found in the email body. While most email clients block script execution, the presence of JavaScript in an email is a strong indicator of malicious intent. The script may attempt to execute in webmail clients or legacy email renderers.',
      evidence: truncateEvidence(match[0], 300),
      mitreTactic: 'T1059.007 — Command and Scripting Interpreter: JavaScript'
    });
  }

  // javascript: protocol in href, src, action, etc.
  const jsProtocolRegex = /(?:href|src|action|background|formaction|poster|data)\s*=\s*["']\s*javascript\s*:[^"']*["']/gi;
  while ((match = jsProtocolRegex.exec(html)) !== null) {
    findings.push({
      type: 'embedded-script',
      severity: 'critical',
      title: 'JavaScript Protocol Handler',
      description: 'A javascript: protocol URI was detected in an HTML attribute. This is a code injection technique that attempts to execute JavaScript when the user interacts with the element (clicks a link, submits a form, etc.).',
      evidence: truncateEvidence(match[0]),
      mitreTactic: 'T1059.007 — Command and Scripting Interpreter: JavaScript'
    });
  }

  // Event handlers (onclick, onload, onmouseover, onerror, etc.)
  const eventHandlerRegex = /<[a-z][a-z0-9]*\b[^>]*\b(on(?:click|load|error|mouseover|mouseout|mouseenter|mouseleave|focus|blur|submit|change|keydown|keyup|keypress|dblclick|contextmenu|abort|beforeunload|unload|resize|scroll|pointerdown|pointerup|touchstart|touchend))\s*=\s*["'][^"']*["'][^>]*>/gi;
  while ((match = eventHandlerRegex.exec(html)) !== null) {
    findings.push({
      type: 'embedded-script',
      severity: 'high',
      title: `Event Handler Detected (${match[1]})`,
      description: `An HTML event handler attribute "${match[1]}" was found. Event handlers can execute JavaScript code in response to user actions or page events. While most modern email clients strip these, their presence indicates potential malicious intent.`,
      evidence: truncateEvidence(match[0]),
      mitreTactic: 'T1059.007 — Command and Scripting Interpreter: JavaScript'
    });
  }

  // data: URIs (can embed scripts, HTML, or other content)
  const dataUriRegex = /(?:href|src|action|background)\s*=\s*["']\s*(data\s*:[^"']{10,})["']/gi;
  while ((match = dataUriRegex.exec(html)) !== null) {
    const dataUri = match[1];
    let severity: ContentFindingSeverity = 'medium';
    let title = 'Data URI Detected';
    let description = 'A data: URI was found in an HTML attribute. Data URIs embed content directly in the HTML and can be used to smuggle payloads past URL-based security filters.';

    if (/data\s*:\s*text\/html/i.test(dataUri)) {
      severity = 'critical';
      title = 'HTML Data URI (Potential Phishing)';
      description = 'A data: URI containing text/html was detected. This can render a complete HTML page (including forms and scripts) when clicked, enabling sophisticated phishing attacks that bypass URL reputation systems.';
    } else if (/data\s*:\s*(?:application\/javascript|text\/javascript)/i.test(dataUri)) {
      severity = 'critical';
      title = 'JavaScript Data URI';
      description = 'A data: URI containing JavaScript code was detected. This is a direct code execution attempt that bypasses traditional URL-based security controls.';
    }

    findings.push({
      type: 'data-uri',
      severity,
      title,
      description,
      evidence: truncateEvidence(match[0]),
      mitreTactic: 'T1027.006 — Obfuscated Files or Information: HTML Smuggling'
    });
  }

  // Base64 encoded content in the HTML body
  const base64BlockRegex = /(?:base64\s*,\s*)([A-Za-z0-9+/=]{100,})/g;
  while ((match = base64BlockRegex.exec(html)) !== null) {
    findings.push({
      type: 'encoded-content',
      severity: 'medium',
      title: 'Large Base64-Encoded Block',
      description: `A large base64-encoded data block (${match[1].length} characters) was found. While base64 is used legitimately for inline images, large encoded blocks may conceal malicious scripts, HTML, or binary payloads that bypass content inspection.`,
      evidence: truncateEvidence(match[0], 150),
      mitreTactic: 'T1027 — Obfuscated Files or Information'
    });
  }

  // VBScript
  const vbscriptRegex = /(?:href|src|action)\s*=\s*["']\s*vbscript\s*:[^"']*["']/gi;
  while ((match = vbscriptRegex.exec(html)) !== null) {
    findings.push({
      type: 'embedded-script',
      severity: 'critical',
      title: 'VBScript Protocol Handler',
      description: 'A vbscript: protocol URI was detected. VBScript execution in email content is a critical threat that can lead to arbitrary code execution on Windows systems using legacy email clients.',
      evidence: truncateEvidence(match[0]),
      mitreTactic: 'T1059.005 — Command and Scripting Interpreter: Visual Basic'
    });
  }

  // <object>, <embed>, <applet> tags
  const dangerousTagRegex = /<(object|embed|applet|iframe)\b[^>]*>/gi;
  while ((match = dangerousTagRegex.exec(html)) !== null) {
    findings.push({
      type: 'embedded-script',
      severity: 'high',
      title: `Dangerous HTML Element (<${match[1]}>)`,
      description: `A <${match[1]}> element was detected in the email. These elements can load external content, execute plugins, or render embedded documents. While most email clients block these, their presence is a strong indicator of malicious intent.`,
      evidence: truncateEvidence(match[0]),
      mitreTactic: 'T1204.001 — User Execution: Malicious Link'
    });
  }

  // <meta http-equiv="refresh"> (auto-redirect)
  const metaRefreshRegex = /<meta\b[^>]*http-equiv\s*=\s*["']refresh["'][^>]*>/gi;
  while ((match = metaRefreshRegex.exec(html)) !== null) {
    findings.push({
      type: 'embedded-script',
      severity: 'high',
      title: 'Meta Refresh Redirect',
      description: 'A <meta> tag with http-equiv="refresh" was detected, which can automatically redirect the email reader to an external URL without user interaction. This is commonly used in phishing to redirect victims to credential harvesting pages.',
      evidence: truncateEvidence(match[0]),
      mitreTactic: 'T1204.001 — User Execution: Malicious Link'
    });
  }

  return findings;
}

// ─── OVERALL RISK CALCULATION ─────────────────────────────────────────────

function calculateOverallRisk(findings: ContentFinding[]): ContentFindingSeverity {
  if (findings.length === 0) return 'info';

  const severityOrder: ContentFindingSeverity[] = ['info', 'low', 'medium', 'high', 'critical'];
  let maxSeverity: ContentFindingSeverity = 'info';

  for (const finding of findings) {
    if (severityOrder.indexOf(finding.severity) > severityOrder.indexOf(maxSeverity)) {
      maxSeverity = finding.severity;
    }
  }

  return maxSeverity;
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────

export function analyzeContent(html: string): ContentAnalysis {
  if (!html || html.trim().length === 0) {
    return {
      findings: [],
      hiddenTextCount: 0,
      trackingPixelCount: 0,
      suspiciousFormCount: 0,
      embeddedScriptCount: 0,
      overallRisk: 'info',
      hasHtml: false
    };
  }

  const allFindings: ContentFinding[] = [
    ...detectHiddenText(html),
    ...detectTrackingPixels(html),
    ...detectSuspiciousForms(html),
    ...detectEmbeddedScripts(html),
  ];

  // Deduplicate by evidence (same exact match shouldn't appear twice)
  const seen = new Set<string>();
  const uniqueFindings = allFindings.filter(f => {
    const key = `${f.type}:${f.evidence}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by severity (critical first)
  const severityOrder: ContentFindingSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
  uniqueFindings.sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity));

  return {
    findings: uniqueFindings,
    hiddenTextCount: uniqueFindings.filter(f => f.type === 'hidden-text').length,
    trackingPixelCount: uniqueFindings.filter(f => f.type === 'tracking-pixel').length,
    suspiciousFormCount: uniqueFindings.filter(f => f.type === 'suspicious-form').length,
    embeddedScriptCount: uniqueFindings.filter(f => f.type === 'embedded-script' || f.type === 'encoded-content' || f.type === 'data-uri').length,
    overallRisk: calculateOverallRisk(uniqueFindings),
    hasHtml: true
  };
}
