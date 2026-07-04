import type { DomainAnalysis, DomainFinding } from '../types';

/**
 * Domain Impersonation / Typosquatting Analyzer
 * 
 * Detects:
 * - Homograph attacks (character substitution: l→1, o→0, rn→m)
 * - Punycode/IDN abuse (xn-- domains with look-alike Unicode characters)
 * - Typosquatting (extra/missing/swapped characters, wrong TLDs)
 * - Brand impersonation via subdomain abuse (paypal.com.evil.com)
 * - Combo-squatting (legitimate brand + extra words: paypal-secure.com)
 */

// ─── KNOWN BRAND DATABASE ─────────────────────────────────────────────────
// Each brand entry includes the canonical domain and common variations

interface BrandEntry {
  name: string;
  domains: string[];       // canonical domains
  keywords: string[];      // brand keywords to detect in combo-squatting
}

const BRAND_DATABASE: BrandEntry[] = [
  { name: 'PayPal', domains: ['paypal.com'], keywords: ['paypal'] },
  { name: 'Microsoft', domains: ['microsoft.com', 'outlook.com', 'live.com', 'hotmail.com', 'office.com', 'office365.com', 'microsoftonline.com'], keywords: ['microsoft', 'outlook', 'hotmail'] },
  { name: 'Google', domains: ['google.com', 'gmail.com', 'googlemail.com', 'googleapis.com'], keywords: ['google', 'gmail'] },
  { name: 'Apple', domains: ['apple.com', 'icloud.com', 'me.com', 'mac.com'], keywords: ['apple', 'icloud'] },
  { name: 'Amazon', domains: ['amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.in', 'amazonaws.com'], keywords: ['amazon', 'aws'] },
  { name: 'Facebook / Meta', domains: ['facebook.com', 'fb.com', 'meta.com', 'instagram.com', 'whatsapp.com'], keywords: ['facebook', 'instagram', 'whatsapp', 'meta'] },
  { name: 'Netflix', domains: ['netflix.com'], keywords: ['netflix'] },
  { name: 'LinkedIn', domains: ['linkedin.com'], keywords: ['linkedin'] },
  { name: 'Twitter / X', domains: ['twitter.com', 'x.com'], keywords: ['twitter'] },
  { name: 'Dropbox', domains: ['dropbox.com'], keywords: ['dropbox'] },
  { name: 'Adobe', domains: ['adobe.com'], keywords: ['adobe'] },
  { name: 'Zoom', domains: ['zoom.us', 'zoom.com'], keywords: ['zoom'] },
  { name: 'Slack', domains: ['slack.com'], keywords: ['slack'] },
  { name: 'Chase', domains: ['chase.com', 'jpmorganchase.com'], keywords: ['chase', 'jpmorgan'] },
  { name: 'Bank of America', domains: ['bankofamerica.com', 'bofa.com'], keywords: ['bankofamerica', 'bofa'] },
  { name: 'Wells Fargo', domains: ['wellsfargo.com'], keywords: ['wellsfargo'] },
  { name: 'Citibank', domains: ['citi.com', 'citibank.com'], keywords: ['citi', 'citibank'] },
  { name: 'HSBC', domains: ['hsbc.com'], keywords: ['hsbc'] },
  { name: 'DHL', domains: ['dhl.com', 'dhl.de'], keywords: ['dhl'] },
  { name: 'FedEx', domains: ['fedex.com'], keywords: ['fedex'] },
  { name: 'UPS', domains: ['ups.com'], keywords: ['ups'] },
  { name: 'USPS', domains: ['usps.com'], keywords: ['usps'] },
  { name: 'DocuSign', domains: ['docusign.com', 'docusign.net'], keywords: ['docusign'] },
  { name: 'Salesforce', domains: ['salesforce.com'], keywords: ['salesforce'] },
  { name: 'GitHub', domains: ['github.com', 'github.io'], keywords: ['github'] },
  { name: 'Stripe', domains: ['stripe.com'], keywords: ['stripe'] },
  { name: 'Coinbase', domains: ['coinbase.com'], keywords: ['coinbase'] },
  { name: 'Binance', domains: ['binance.com'], keywords: ['binance'] },
  { name: 'IRS', domains: ['irs.gov'], keywords: ['irs'] },
  { name: 'HMRC', domains: ['hmrc.gov.uk'], keywords: ['hmrc'] },
  { name: 'Yahoo', domains: ['yahoo.com', 'ymail.com'], keywords: ['yahoo'] },
  { name: 'eBay', domains: ['ebay.com'], keywords: ['ebay'] },
  { name: 'Spotify', domains: ['spotify.com'], keywords: ['spotify'] },
  { name: 'Steam', domains: ['steampowered.com', 'steamcommunity.com'], keywords: ['steam'] },
  { name: 'Walmart', domains: ['walmart.com'], keywords: ['walmart'] },
  { name: 'Target', domains: ['target.com'], keywords: ['target'] },
  { name: 'Samsung', domains: ['samsung.com'], keywords: ['samsung'] },
];

// ─── HOMOGRAPH CHARACTER MAP ──────────────────────────────────────────────
// Maps visually similar characters used in homograph attacks

const HOMOGRAPH_MAP: Record<string, string[]> = {
  'a': ['а', 'ɑ', 'α', '@', '4'],          // Cyrillic а, Latin ɑ, Greek α
  'b': ['Ь', 'ь', '6'],                      // Cyrillic soft sign
  'c': ['с', 'ϲ', '('],                      // Cyrillic с, Greek lunate sigma
  'd': ['ԁ', 'ɗ'],                           // Cyrillic palochka-d
  'e': ['е', 'ё', 'ε', '3'],                 // Cyrillic е, Greek epsilon
  'g': ['ɡ', 'ǥ', '9'],
  'h': ['һ', 'ℎ'],                           // Cyrillic shha
  'i': ['і', 'ı', '1', 'l', '|', '!'],       // Cyrillic i, dotless i
  'j': ['ј'],                                 // Cyrillic je
  'k': ['κ', 'к'],                            // Greek kappa, Cyrillic ka
  'l': ['1', 'I', '|', 'ӏ', 'ℓ'],            // Number 1, capital I, Cyrillic palochka
  'm': ['rn', 'ⅿ', 'м'],                     // rn combo, Roman numeral m
  'n': ['ñ', 'ν', 'п'],                       // Greek nu, Cyrillic pe
  'o': ['0', 'ο', 'о', 'ø', 'θ'],            // Zero, Greek omicron, Cyrillic o
  'p': ['р', 'ρ'],                             // Cyrillic er, Greek rho
  'q': ['ԛ'],
  'r': ['г', 'ⅰ'],                            // Cyrillic ge
  's': ['ѕ', '$', '5'],                        // Cyrillic dze
  't': ['т', '+', '7'],                        // Cyrillic te
  'u': ['υ', 'ц', 'µ'],                       // Greek upsilon
  'v': ['ν', 'ⅴ'],                            // Greek nu, Roman numeral v
  'w': ['ω', 'ш', 'vv'],                      // Greek omega, Cyrillic sha, double-v
  'x': ['х', '×'],                             // Cyrillic kha
  'y': ['у', 'γ'],                             // Cyrillic u, Greek gamma
  'z': ['ζ'],                                  // Greek zeta
};

// Reverse map: look-alike char → canonical char
const REVERSE_HOMOGRAPH: Map<string, string> = new Map();
for (const [canonical, alikes] of Object.entries(HOMOGRAPH_MAP)) {
  for (const alike of alikes) {
    REVERSE_HOMOGRAPH.set(alike, canonical);
  }
}

// ─── UTILITY FUNCTIONS ────────────────────────────────────────────────────

/** Extract the registrable domain (e.g., "evil.com" from "paypal.com.evil.com") */
function getBaseDomain(domain: string): string {
  const parts = domain.split('.');
  if (parts.length <= 2) return domain;
  // Handle co.uk, com.au, etc.
  const twoPartTLDs = ['co.uk', 'com.au', 'co.in', 'co.jp', 'co.kr', 'com.br', 'com.mx', 'org.uk', 'net.au', 'gov.uk'];
  const lastTwo = parts.slice(-2).join('.');
  if (twoPartTLDs.includes(lastTwo)) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

/** Normalize a domain by converting homograph characters to their ASCII equivalents */
function normalizeHomoglyphs(domain: string): string {
  let normalized = '';
  let i = 0;
  while (i < domain.length) {
    // Check two-character substitutions first (e.g., "rn" → "m", "vv" → "w")
    if (i < domain.length - 1) {
      const twoChar = domain.substring(i, i + 2);
      if (REVERSE_HOMOGRAPH.has(twoChar)) {
        normalized += REVERSE_HOMOGRAPH.get(twoChar)!;
        i += 2;
        continue;
      }
    }
    const char = domain[i];
    if (REVERSE_HOMOGRAPH.has(char)) {
      normalized += REVERSE_HOMOGRAPH.get(char)!;
    } else {
      normalized += char;
    }
    i++;
  }
  return normalized;
}

/** Calculate Levenshtein distance between two strings */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

/** Check if domain contains keyboard-adjacent character swaps */
const KEYBOARD_ADJACENT: Record<string, string[]> = {
  'a': ['s', 'q', 'w', 'z'],
  'b': ['v', 'n', 'g', 'h'],
  'c': ['x', 'v', 'd', 'f'],
  'd': ['s', 'f', 'e', 'r', 'c', 'x'],
  'e': ['w', 'r', 'd', 's'],
  'f': ['d', 'g', 'r', 't', 'v', 'c'],
  'g': ['f', 'h', 't', 'y', 'b', 'v'],
  'h': ['g', 'j', 'y', 'u', 'n', 'b'],
  'i': ['u', 'o', 'k', 'j'],
  'j': ['h', 'k', 'u', 'i', 'n', 'm'],
  'k': ['j', 'l', 'i', 'o', 'm'],
  'l': ['k', 'o', 'p'],
  'm': ['n', 'j', 'k'],
  'n': ['b', 'm', 'h', 'j'],
  'o': ['i', 'p', 'l', 'k'],
  'p': ['o', 'l'],
  'q': ['w', 'a'],
  'r': ['e', 't', 'd', 'f'],
  's': ['a', 'd', 'w', 'e', 'z', 'x'],
  't': ['r', 'y', 'f', 'g'],
  'u': ['y', 'i', 'h', 'j'],
  'v': ['c', 'b', 'f', 'g'],
  'w': ['q', 'e', 'a', 's'],
  'x': ['z', 'c', 's', 'd'],
  'y': ['t', 'u', 'g', 'h'],
  'z': ['a', 'x', 's'],
};

// ─── DETECTION FUNCTIONS ──────────────────────────────────────────────────

function detectHomographAttack(senderDomain: string, allDomains: string[]): DomainFinding[] {
  const findings: DomainFinding[] = [];

  for (const brand of BRAND_DATABASE) {
    for (const brandDomain of brand.domains) {
      // Skip if it's an exact match (legitimate)
      if (senderDomain.toLowerCase() === brandDomain) continue;

      // Check if normalizing homoglyphs makes it match a brand
      const brandBase = brandDomain.split('.')[0];
      const senderBase = senderDomain.split('.')[0].toLowerCase();
      const normalizedBase = normalizeHomoglyphs(senderBase);

      if (normalizedBase === brandBase && senderBase !== brandBase) {
        findings.push({
          type: 'homograph',
          severity: 'critical',
          brand: brand.name,
          legitimateDomain: brandDomain,
          suspiciousDomain: senderDomain,
          title: `Homograph Attack — Impersonating ${brand.name}`,
          description: `The sender domain "${senderDomain}" uses visually similar characters to impersonate "${brandDomain}". After normalizing look-alike characters (Cyrillic, Greek, number substitutions), the domain resolves to "${normalizedBase}" which matches the ${brand.name} brand. This is a classic IDN homograph / character substitution attack.`,
          confidence: 95,
          technique: 'Character Substitution (Homograph)',
        });
      }
    }
  }

  // Also check all extracted domains from the email body
  for (const domain of allDomains) {
    if (domain === senderDomain) continue;
    const domainBase = domain.split('.')[0].toLowerCase();
    const normalizedDomainBase = normalizeHomoglyphs(domainBase);

    for (const brand of BRAND_DATABASE) {
      for (const brandDomain of brand.domains) {
        if (domain.toLowerCase() === brandDomain) continue;
        const brandBase = brandDomain.split('.')[0];
        if (normalizedDomainBase === brandBase && domainBase !== brandBase) {
          findings.push({
            type: 'homograph',
            severity: 'critical',
            brand: brand.name,
            legitimateDomain: brandDomain,
            suspiciousDomain: domain,
            title: `Homograph Domain in Body — Impersonating ${brand.name}`,
            description: `The domain "${domain}" found in the email body uses visually similar characters to impersonate "${brandDomain}". This could be a link designed to trick users into clicking what appears to be a legitimate ${brand.name} URL.`,
            confidence: 90,
            technique: 'Character Substitution (Homograph)',
          });
        }
      }
    }
  }

  return findings;
}

function detectPunycode(senderDomain: string, allDomains: string[]): DomainFinding[] {
  const findings: DomainFinding[] = [];
  const domainsToCheck = [senderDomain, ...allDomains];
  const seen = new Set<string>();

  for (const domain of domainsToCheck) {
    if (seen.has(domain)) continue;
    seen.add(domain);

    // Check for Punycode (xn-- prefix)
    if (domain.toLowerCase().includes('xn--')) {
      const isSender = domain === senderDomain;
      findings.push({
        type: 'punycode',
        severity: 'high',
        brand: 'Unknown',
        legitimateDomain: 'N/A',
        suspiciousDomain: domain,
        title: `Punycode/IDN Domain ${isSender ? '(Sender)' : '(In Body)'}`,
        description: `The domain "${domain}" uses Punycode encoding (xn-- prefix), which represents Internationalized Domain Names (IDN). Punycode domains can display Unicode characters that visually mimic Latin characters, making them appear identical to legitimate domains in the browser's address bar. This is a known technique for phishing attacks.`,
        confidence: 75,
        technique: 'Punycode / IDN Homograph',
      });
    }
  }

  return findings;
}

function detectTyposquatting(senderDomain: string, allDomains: string[]): DomainFinding[] {
  const findings: DomainFinding[] = [];
  const domainsToCheck = new Set([senderDomain, ...allDomains]);

  for (const domain of domainsToCheck) {
    const domainLower = domain.toLowerCase();
    const domainBase = domainLower.split('.')[0];

    for (const brand of BRAND_DATABASE) {
      for (const brandDomain of brand.domains) {
        if (domainLower === brandDomain) continue;
        const brandBase = brandDomain.split('.')[0];

        // Skip if lengths are too different (not a typo)
        if (Math.abs(domainBase.length - brandBase.length) > 3) continue;

        const distance = levenshtein(domainBase, brandBase);

        // Very close match (1-2 edit distance) — likely typosquatting
        if (distance > 0 && distance <= 2 && domainBase.length >= 4) {
          const isSender = domain === senderDomain;

          // Determine specific technique
          let technique = 'Typosquatting';
          if (domainBase.length === brandBase.length) {
            // Same length — character substitution or swap
            let diffPositions: number[] = [];
            for (let i = 0; i < domainBase.length; i++) {
              if (domainBase[i] !== brandBase[i]) diffPositions.push(i);
            }
            if (diffPositions.length === 2 && Math.abs(diffPositions[0] - diffPositions[1]) === 1) {
              // Adjacent characters swapped
              if (domainBase[diffPositions[0]] === brandBase[diffPositions[1]] &&
                  domainBase[diffPositions[1]] === brandBase[diffPositions[0]]) {
                technique = 'Character Transposition';
              }
            }
            if (diffPositions.length === 1) {
              const origChar = brandBase[diffPositions[0]];
              const newChar = domainBase[diffPositions[0]];
              if (KEYBOARD_ADJACENT[origChar]?.includes(newChar)) {
                technique = 'Keyboard-Adjacent Typo';
              }
            }
          } else if (domainBase.length === brandBase.length + 1) {
            technique = 'Character Insertion';
          } else if (domainBase.length === brandBase.length - 1) {
            technique = 'Character Omission';
          }

          findings.push({
            type: 'typosquat',
            severity: distance === 1 ? 'high' : 'medium',
            brand: brand.name,
            legitimateDomain: brandDomain,
            suspiciousDomain: domain,
            title: `${technique} — Impersonating ${brand.name} ${isSender ? '(Sender)' : '(In Body)'}`,
            description: `The domain "${domain}" is ${distance} edit distance${distance > 1 ? 's' : ''} from "${brandDomain}". This is a ${technique.toLowerCase()} attack where "${domainBase}" closely mimics "${brandBase}". Such domains are registered to trick users who misread or quickly glance at the sender address or embedded links.`,
            confidence: distance === 1 ? 85 : 70,
            technique,
          });
        }
      }
    }
  }

  return findings;
}

function detectSubdomainAbuse(senderDomain: string, allDomains: string[]): DomainFinding[] {
  const findings: DomainFinding[] = [];
  const domainsToCheck = new Set([senderDomain, ...allDomains]);

  for (const domain of domainsToCheck) {
    const domainLower = domain.toLowerCase();
    const parts = domainLower.split('.');
    if (parts.length <= 2) continue;

    // Check if any brand name appears as a subdomain (not the registrable domain)
    const baseDomain = getBaseDomain(domainLower);

    for (const brand of BRAND_DATABASE) {
      // Is a brand keyword used as a subdomain of a non-brand domain?
      for (const brandDomain of brand.domains) {
        if (domainLower === brandDomain || baseDomain === brandDomain) continue;

        // Check if any subdomain part matches a brand domain name
        const brandBase = brandDomain.split('.')[0];
        const subdomainParts = domainLower.replace('.' + baseDomain, '').split('.');

        for (const sub of subdomainParts) {
          if (sub === brandBase || sub === brandDomain.replace('.', '-') || sub.includes(brandBase)) {
            const isSender = domain === senderDomain;
            findings.push({
              type: 'subdomain-abuse',
              severity: 'high',
              brand: brand.name,
              legitimateDomain: brandDomain,
              suspiciousDomain: domain,
              title: `Subdomain Abuse — Impersonating ${brand.name} ${isSender ? '(Sender)' : '(In Body)'}`,
              description: `The domain "${domain}" uses "${brandBase}" as a subdomain of "${baseDomain}" to impersonate ${brand.name}. The actual registrable domain is "${baseDomain}", not "${brandDomain}". This is a subdomain spoofing technique where attackers create subdomains containing trusted brand names to deceive recipients.`,
              confidence: 80,
              technique: 'Subdomain Spoofing',
            });
            break;
          }
        }
      }
    }
  }

  return findings;
}

function detectComboSquatting(senderDomain: string, allDomains: string[]): DomainFinding[] {
  const findings: DomainFinding[] = [];
  const domainsToCheck = new Set([senderDomain, ...allDomains]);

  // Common combo-squatting patterns
  const comboPatterns = [
    'secure', 'login', 'signin', 'verify', 'update', 'account', 'auth',
    'support', 'help', 'service', 'alert', 'notification', 'confirm',
    'billing', 'payment', 'security', 'team', 'admin', 'mail', 'online',
    'portal', 'web', 'app', 'mobile', 'center', 'info', 'official'
  ];

  for (const domain of domainsToCheck) {
    const domainLower = domain.toLowerCase();
    const domainBase = domainLower.split('.')[0];

    for (const brand of BRAND_DATABASE) {
      for (const keyword of brand.keywords) {
        // Skip exact matches to brand domains
        if (brand.domains.includes(domainLower)) continue;

        // Check if domain base contains the brand keyword + extra text
        if (domainBase.includes(keyword) && domainBase !== keyword) {
          // Verify it's not just a subdomain of the real brand
          const baseDomain = getBaseDomain(domainLower);
          if (brand.domains.includes(baseDomain)) continue;

          // Extract the "extra" part
          const extra = domainBase.replace(keyword, '').replace(/^[-_.]|[-_.]$/g, '');
          if (extra.length === 0) continue;

          // Check if the extra part matches combo-squatting patterns
          const isComboPattern = comboPatterns.some(p => extra.includes(p));
          const isSender = domain === senderDomain;

          if (isComboPattern || extra.length >= 2) {
            findings.push({
              type: 'combosquat',
              severity: isComboPattern ? 'high' : 'medium',
              brand: brand.name,
              legitimateDomain: brand.domains[0],
              suspiciousDomain: domain,
              title: `Combo-Squatting — Impersonating ${brand.name} ${isSender ? '(Sender)' : '(In Body)'}`,
              description: `The domain "${domain}" combines the "${keyword}" brand name with "${extra}" to create a convincing impersonation domain. ${isComboPattern ? `The word "${comboPatterns.find(p => extra.includes(p))}" is commonly used in combo-squatting attacks to add urgency or legitimacy.` : 'This combo-squatting technique adds extra text to a brand name to create a deceptive domain.'}`,
              confidence: isComboPattern ? 80 : 60,
              technique: 'Combo-Squatting',
            });
          }
        }
      }
    }
  }

  return findings;
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────

export function analyzeDomains(
  senderDomain: string,
  allDomains: string[],
  allUrls: string[]
): DomainAnalysis {
  // Extract domains from URLs too
  const urlDomains: string[] = [];
  for (const url of allUrls) {
    try {
      const parsed = new URL(url);
      urlDomains.push(parsed.hostname);
    } catch { /* ignore invalid URLs */ }
  }

  const combinedDomains = Array.from(new Set([...allDomains, ...urlDomains]));

  const allFindings: DomainFinding[] = [
    ...detectHomographAttack(senderDomain, combinedDomains),
    ...detectPunycode(senderDomain, combinedDomains),
    ...detectTyposquatting(senderDomain, combinedDomains),
    ...detectSubdomainAbuse(senderDomain, combinedDomains),
    ...detectComboSquatting(senderDomain, combinedDomains),
  ];

  // Deduplicate by domain + type
  const seen = new Set<string>();
  const uniqueFindings = allFindings.filter(f => {
    const key = `${f.type}:${f.suspiciousDomain}:${f.brand}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort: critical first, then high, etc.
  const severityOrder = ['critical', 'high', 'medium', 'low', 'info'];
  uniqueFindings.sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity));

  // Determine targeted brands
  const targetedBrands = Array.from(new Set(uniqueFindings.map(f => f.brand).filter(b => b !== 'Unknown')));

  return {
    findings: uniqueFindings,
    senderDomain,
    isExactBrandMatch: BRAND_DATABASE.some(b => b.domains.includes(senderDomain.toLowerCase())),
    targetedBrands,
    homographCount: uniqueFindings.filter(f => f.type === 'homograph').length,
    punycodeCount: uniqueFindings.filter(f => f.type === 'punycode').length,
    typosquatCount: uniqueFindings.filter(f => f.type === 'typosquat').length,
    subdomainAbuseCount: uniqueFindings.filter(f => f.type === 'subdomain-abuse').length,
    comboSquatCount: uniqueFindings.filter(f => f.type === 'combosquat').length,
  };
}
