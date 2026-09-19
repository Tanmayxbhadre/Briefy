// ============================================================
// Briefy — Unified Category Taxonomy (11 Categories)
// Single source of truth across Navigation, Drawers, Footers, and Sitemaps.
// ============================================================

export interface CategoryDefinition {
  id: string;
  name: string;
  slug: string;
  shortLabel?: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
}

export const SITE_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'c1',
    name: 'India',
    slug: 'india',
    description: 'Track key political decisions, legislative policy, Supreme Court rulings, state assembly elections, and macroeconomic developments shaping modern India. Our newsroom synthesizes verified reporting across national institutions, infrastructure initiatives, and domestic affairs.',
    seoTitle: 'India News Today | Briefy.live',
    seoDescription: 'Comprehensive reporting on Indian politics, policy decisions, national affairs, governance, and public developments across states.',
  },
  {
    id: 'c2',
    name: 'World',
    slug: 'world',
    description: 'Authoritative reporting on international diplomacy, geopolitical conflicts, bilateral agreements, and multilateral summits across the globe. Follow structured breakdowns of foreign elections, United Nations security measures, and global trade dynamics.',
    seoTitle: 'World News Today | Briefy.live',
    seoDescription: 'Follow verified international news, diplomatic relations, geopolitical events, and global affairs reported by Briefy.live.',
  },
  {
    id: 'c3',
    name: 'Technology',
    slug: 'technology',
    description: 'Essential reporting on enterprise technology, semiconductor hardware, operating systems, consumer electronics, and cybersecurity. We analyze platform shifts from major tech ecosystems, developer tooling, and global digital infrastructure.',
    seoTitle: 'Technology News | Briefy.live',
    seoDescription: 'Breaking tech news covering hardware advancements, software ecosystems, cybersecurity alerts, and the enterprise tech sector.',
  },
  {
    id: 'c4',
    name: 'AI',
    slug: 'ai',
    description: 'In-depth coverage of artificial intelligence research, foundation model benchmarks, multimodal generative systems, and compute cluster infrastructure. Follow real-time insights on AI safety frameworks, regulatory policy, and enterprise adoption.',
    seoTitle: 'AI News & Research | Briefy.live',
    seoDescription: 'Latest artificial intelligence news: foundation model releases, AI safety research, compute scaling, and industry adoption.',
  },
  {
    id: 'c5',
    name: 'Business',
    slug: 'business',
    description: 'Corporate strategy, executive appointments, cross-border mergers, supply chain shifts, and industrial manufacturing updates. We provide structured coverage on major multinational enterprises, regulatory scrutiny, and sector earnings.',
    seoTitle: 'Business News & Strategy | Briefy.live',
    seoDescription: 'Indian and global business coverage: corporate mergers, industry shifts, executive strategy, and economic policy updates.',
  },
  {
    id: 'c6',
    name: 'Finance',
    slug: 'finance',
    description: 'Real-time coverage of equity benchmarks, central bank interest rate decisions, bond yields, currency fluctuations, and institutional finance. Get concise reporting on macroeconomic indicators, banking policy, and market movements.',
    seoTitle: 'Finance & Market News | Briefy.live',
    seoDescription: 'Stock market updates, Sensex, Nifty, central bank interest rates, macroeconomic indicators, and institutional finance news.',
  },
  {
    id: 'c7',
    name: 'Startups',
    slug: 'startups',
    description: 'Venture capital funding rounds, seed investments, accelerator cohorts, and unicorn valuations across emerging innovation hubs. Discover strategic analysis of founder journeys, product-market fit, and early-stage tech ecosystems.',
    seoTitle: 'Startup & VC News | Briefy.live',
    seoDescription: 'Venture capital rounds, angel funding, startup investments, unicorn growth, and early-stage technology innovations.',
  },
  {
    id: 'c8',
    name: 'Science',
    slug: 'science',
    description: 'Discoveries in astrophysics, planetary exploration, clean energy engineering, quantum physics, and biomedical research. We summarize peer-reviewed milestones from space agencies and international research laboratories with precision.',
    seoTitle: 'Science & Discovery | Briefy.live',
    seoDescription: 'Latest discoveries in astrophysics, space exploration missions, quantum computing research, and environmental sciences.',
  },
  {
    id: 'c9',
    name: 'Sports',
    slug: 'sports',
    description: 'Match reports, tournament standings, transfer developments, and championship coverage across cricket, football, tennis, Formula 1, and the Olympic Games. We deliver verified updates on global athletic competitions.',
    seoTitle: 'Sports News & Scores | Briefy.live',
    seoDescription: 'Verified sports coverage across international cricket tournaments, football leagues, tennis grand slams, and motorsports.',
  },
  {
    id: 'c10',
    name: 'Gaming',
    slug: 'gaming',
    description: 'Video game industry news, console platform updates, major studio releases, game engine technologies, and competitive esports tournaments. Follow verified reporting on upcoming titles and interactive entertainment.',
    seoTitle: 'Gaming News & Esports | Briefy.live',
    seoDescription: 'Video game releases, console updates, esports tournament highlights, studio acquisitions, and gaming industry news.',
  },
  {
    id: 'c11',
    name: 'Entertainment',
    slug: 'entertainment',
    description: 'Film festival premieres, box office metrics, streaming television releases, industry labor negotiations, and cultural commentary. We synthesize factual developments from global cinema and digital media.',
    seoTitle: 'Entertainment News | Briefy.live',
    seoDescription: 'Coverage of film festival premieres, box office records, streaming platform releases, and media industry developments.',
  },
];

export const CATEGORY_BY_SLUG = new Map<string, CategoryDefinition>(
  SITE_CATEGORIES.map((c) => [c.slug, c])
);

// Primary categories for desktop header nav
export const HEADER_NAV_LINKS = [
  { label: 'Latest', href: '/daily-news' },
  ...SITE_CATEGORIES.map((c) => ({
    label: c.name,
    href: `/${c.slug}`,
  })),
];

// Mobile category rail (All, Latest, then 11 categories)
export const MOBILE_RAIL_CATEGORIES = [
  { label: 'All', href: '/' },
  { label: 'Latest', href: '/daily-news' },
  ...SITE_CATEGORIES.map((c) => ({
    label: c.name,
    href: `/${c.slug}`,
  })),
];

// Footer sections
export const FOOTER_TOPICS_PRIMARY = SITE_CATEGORIES.slice(0, 6).map((c) => ({
  label: c.name,
  href: `/${c.slug}`,
}));

export const FOOTER_TOPICS_SECONDARY = SITE_CATEGORIES.slice(6).map((c) => ({
  label: c.name,
  href: `/${c.slug}`,
}));
