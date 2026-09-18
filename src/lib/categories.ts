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
    description: 'Politics, policy, national affairs, and developments across India.',
    seoTitle: 'India News',
    seoDescription: 'Comprehensive reporting on Indian politics, policy, state developments, national affairs, and society.',
  },
  {
    id: 'c2',
    name: 'World',
    slug: 'world',
    description: 'International news, global diplomacy, and geopolitical developments.',
    seoTitle: 'World News',
    seoDescription: 'Follow the latest international news, global developments, and geopolitical events from around the world.',
  },
  {
    id: 'c3',
    name: 'Technology',
    slug: 'technology',
    description: 'Tech giants, consumer electronics, internet culture, and digital infrastructure.',
    seoTitle: 'Technology News',
    seoDescription: 'Breaking tech news covering hardware, software, cybersecurity, digital platforms, and the tech industry.',
  },
  {
    id: 'c4',
    name: 'AI',
    slug: 'ai',
    description: 'Artificial intelligence breakthroughs, foundation models, and policy.',
    seoTitle: 'AI News & Insights',
    seoDescription: 'Latest artificial intelligence news: model releases, research breakthroughs, AI safety, and industry adoption.',
  },
  {
    id: 'c5',
    name: 'Business',
    slug: 'business',
    description: 'Corporate strategy, industry shifts, trade, and executive leadership.',
    seoTitle: 'Business News',
    seoDescription: 'Covering Indian and global corporate news, mergers, industry shifts, economic policy, and business strategy.',
  },
  {
    id: 'c6',
    name: 'Finance',
    slug: 'finance',
    description: 'Markets, banking, monetary policy, personal finance, and crypto.',
    seoTitle: 'Finance & Markets',
    seoDescription: 'Stock markets, banking sector updates, macroeconomic indicators, and investment analysis.',
  },
  {
    id: 'c7',
    name: 'Startups',
    slug: 'startups',
    description: 'Venture capital, early-stage innovations, and founder stories.',
    seoTitle: 'Startups & Venture Capital',
    seoDescription: 'Indian and global startup news: funding rounds, unicorn developments, and founder journeys.',
  },
  {
    id: 'c8',
    name: 'Science',
    slug: 'science',
    description: 'Space exploration, climate science, energy, and medical discoveries.',
    seoTitle: 'Science & Discovery',
    seoDescription: 'Latest discoveries in astrophysics, space exploration, clean energy, biology, and climate science.',
  },
  {
    id: 'c9',
    name: 'Sports',
    slug: 'sports',
    description: 'Cricket, football, Olympics, and international sporting events.',
    seoTitle: 'Sports News & Scores',
    seoDescription: 'Coverage of cricket, football, motorsports, tennis, and major tournament analyses.',
  },
  {
    id: 'c10',
    name: 'Gaming',
    slug: 'gaming',
    description: 'Esports, gaming industry, studios, and new title releases.',
    seoTitle: 'Gaming & Esports',
    seoDescription: 'Game releases, esports tournaments, gaming technology, and studio developments.',
  },
  {
    id: 'c11',
    name: 'Entertainment',
    slug: 'entertainment',
    description: 'Cinema, OTT streaming, music, pop culture, and media.',
    seoTitle: 'Entertainment & Culture',
    seoDescription: 'Latest entertainment news covering film industries, OTT releases, music, and cultural commentary.',
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
