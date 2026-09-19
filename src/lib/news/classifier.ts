/**
 * Precision category classification based on weighted contextual keywords.
 * Prevents cross-domain misclassification (e.g. politics in startups, world news in india).
 */

interface CategoryRule {
  category: string;
  weight: number;
  pattern: RegExp;
}

const CATEGORY_RULES: CategoryRule[] = [
  // High-priority AI patterns
  { category: 'ai', weight: 100, pattern: /\b(artificial intelligence|generative ai|genai|chatgpt|openai|anthropic|claude|gemini|llm|large language model|deep learning|neural network|transformer model)\b/i },
  
  // High-priority Sports patterns
  { category: 'sports', weight: 90, pattern: /\b(ipl|cricket|bcci|icc|test match|t20|odi|premier league|champions league|fifa|uefa|la liga|nba|nfl|formula 1|f1|wimbledon|us open|french open|australian open|olympics|badminton|world cup)\b/i },

  // High-priority Gaming patterns
  { category: 'gaming', weight: 90, pattern: /\b(playstation|ps5|xbox|nintendo|steam deck|esports|gta|grand theft auto|call of duty|fortnite|minecraft|game pass|ubisoft|activision)\b/i },

  // High-priority Entertainment patterns
  { category: 'entertainment', weight: 85, pattern: /\b(box office|trailer|bollywood|hollywood|oscars|academy awards|emmys|grammys|netflix|prime video|disney\+|actor|actress|director|film festival|soundtrack)\b/i },

  // India Domestic Politics & Governance
  { category: 'india', weight: 80, pattern: /\b(narendra modi|lok sabha|rajya sabha|bjp|congress party|aap|delhi high court|supreme court of india|rbi governor|isro|mumbai|new delhi|bengaluru|hyderabad|chennai|kolkata|kerala|uttar pradesh|maharashtra|tamil nadu)\b/i },

  // World Politics, Diplomacy & Geopolitics
  { category: 'world', weight: 80, pattern: /\b(white house|donald trump|joe biden|vladimir putin|volodymyr zelenskyy|xi jinping|kremlin|pentagon|united nations|un security council|nato|european union|gaza|israel|ukraine|russia|taiwan|beijing|greenland|iran|middle east|geopolitics|ceasefire|sanctions bill|foreign minister)\b/i },

  // Startups & Venture Capital
  { category: 'startups', weight: 75, pattern: /\b(venture capital|series [a-e]|seed funding|angel investor|y combinator|sequoia|accel|unicorn valuation|early-stage startup|bootstrapped)\b/i },

  // Finance & Markets
  { category: 'finance', weight: 70, pattern: /\b(stock market|sensex|nifty|wall street|nasdaq|s&p 500|interest rates|inflation data|federal reserve|bond yields|cryptocurrency|bitcoin|ethereum|forex|treasury yields)\b/i },

  // Science & Discovery
  { category: 'science', weight: 70, pattern: /\b(james webb|nasa|hubble|astronomy|astrophysics|quantum computing|black hole|exoplanet|cern|fusion energy|climate change research|neuroscience)\b/i },

  // General Technology
  { category: 'technology', weight: 65, pattern: /\b(apple|google|microsoft|meta|amazon|semiconductor|nvidia|tsmc|qualcomm|intel|cybersecurity|malware|ransomware|smartphone|ios \d+|android \d+)\b/i },

  // General Business
  { category: 'business', weight: 50, pattern: /\b(corporate earnings|q[1-4] results|merger|acquisition|ceo|cfo|supply chain|revenue growth|antitrust investigation)\b/i },
];

export function classifyCategory(title: string, defaultCategory = 'world'): string {
  if (!title) return defaultCategory;

  let bestCategory = defaultCategory;
  let highestWeight = 0;

  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(title)) {
      if (rule.weight > highestWeight) {
        highestWeight = rule.weight;
        bestCategory = rule.category;
      }
    }
  }

  return bestCategory;
}

