import { Article } from '@/lib/types';
import { SITE_URL, SITE_NAME } from '@/lib/site';

interface SchemaOrgProps {
  article?: Article;
  pageType?: 'home' | 'article' | 'category' | 'search';
}

/**
 * JSON-LD structured data.
 *
 * Notes:
 * - Brand name is unified to "Briefy.live" everywhere (previously "BRIEFY" in
 *   JSON-LD vs "Briefy.live" in metadata vs "BRIEFY" in RSS).
 * - Article images ship in all three ratios Google Top Stories accepts
 *   (16:9, 4:3, 1:1) instead of a single one.
 * - speakable selectors target stable, real selectors — the previous
 *   '.headline'/'.description' matched CSS-module classes that are hashed at
 *   build time, and '#article-summary' never existed in the DOM.
 * - author.url only links to a real author page when one exists.
 */
export default function SchemaOrg({ article }: SchemaOrgProps) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'NewsMediaOrganization'],
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/logo.png`,
      width: 600,
      height: 60,
    },
    sameAs: [
      'https://twitter.com/briefylive',
      'https://instagram.com/briefylive',
      'https://linkedin.com/company/briefylive',
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const articleSchema = article
    ? {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        '@id': `${SITE_URL}/${article.category.slug}/${article.slug}`,
        headline: article.title,
        description: article.metaDescription || article.description,
        image: [
          `${article.featuredImage}`,
          // Top Stories accepts multiple ratios; deriving crops from the
          // Unsplash CDN keeps one source image while serving 16:9, 4:3, 1:1.
          ...(article.featuredImage.includes('images.unsplash.com')
            ? [
                `${article.featuredImage.split('?')[0]}?w=1200&h=675&fit=crop`,
                `${article.featuredImage.split('?')[0]}?w=1200&h=900&fit=crop`,
                `${article.featuredImage.split('?')[0]}?w=1200&h=1200&fit=crop`,
              ]
            : []),
        ],
        datePublished: article.publishedAt,
        dateModified: article.updatedAt || article.publishedAt,
        author: {
          '@type': 'Person',
          name: article.author.name,
          ...(article.author.slug === 'briefylive'
            ? {}
            : { url: `${SITE_URL}/author/${article.author.slug}` }),
        },
        publisher: { '@id': `${SITE_URL}/#organization` },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${SITE_URL}/${article.category.slug}/${article.slug}`,
        },
        articleSection: article.category.name,
        keywords: article.tags.join(', '),
        wordCount: article.content
          ? article.content.split(/\s+/).filter(Boolean).length
          : undefined,
        timeRequired: `PT${article.readingTime}M`,
        inLanguage: 'en',
        isAccessibleForFree: true,
        // Speakable targets stable, existing selectors only.
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['h1', 'main'],
        },
      }
    : null;

  const breadcrumbSchema = article
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: SITE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: article.category.name,
            item: `${SITE_URL}/${article.category.slug}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: article.title,
            item: `${SITE_URL}/${article.category.slug}/${article.slug}`,
          },
        ],
      }
    : null;

  const schemas = [
    organizationSchema,
    websiteSchema,
    ...(articleSchema ? [articleSchema] : []),
    ...(breadcrumbSchema ? [breadcrumbSchema] : []),
  ];

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
