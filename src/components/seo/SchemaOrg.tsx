import { Article, Category } from '@/lib/types';
import { SITE_URL, SITE_NAME } from '@/lib/site';
import { getAuthorProfile } from '@/config/authors';

interface SchemaOrgProps {
  article?: Article;
  category?: Category;
  categoryArticles?: Article[];
  pageType?: 'home' | 'article' | 'category' | 'search';
}

export default function SchemaOrg({
  article,
  category,
  categoryArticles,
  pageType = 'home',
}: SchemaOrgProps) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'NewsMediaOrganization'],
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/favicon.png`,
      width: 512,
      height: 512,
    },
    publishingPrinciples: `${SITE_URL}/editorial-policy`,
    ethicsPolicy: `${SITE_URL}/editorial-policy`,
    correctionsPolicy: `${SITE_URL}/corrections-policy`,
    masthead: `${SITE_URL}/masthead`,
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

  let authorSchema: object = {
    '@type': 'NewsMediaOrganization',
    name: SITE_NAME,
    url: SITE_URL,
  };

  if (article?.author?.name) {
    const profile = getAuthorProfile(article.author.name);
    if (profile) {
      authorSchema = {
        '@type': 'Person',
        name: profile.name,
        jobTitle: profile.role,
        url: `${SITE_URL}/author/${profile.slug}`,
        sameAs: profile.sameAs,
      };
    }
  }

  const citations = (article?.sources || [])
    .filter((s) => s.url && s.url.startsWith('http'))
    .map((s) => s.url);

  const articleSchema = article
    ? {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        '@id': `${SITE_URL}/${article.category.slug}/${article.slug}`,
        headline: article.title.slice(0, 110),
        description: article.metaDescription || article.description,
        image: [
          article.featuredImage || `${SITE_URL}/briefy-logo.png`,
          ...(article.featuredImage?.includes('images.unsplash.com')
            ? [
                `${article.featuredImage.split('?')[0]}?w=1200&h=675&fit=crop`,
                `${article.featuredImage.split('?')[0]}?w=1200&h=900&fit=crop`,
                `${article.featuredImage.split('?')[0]}?w=1200&h=1200&fit=crop`,
              ]
            : []),
        ],
        datePublished: article.publishedAt,
        dateModified: article.updatedAt || article.publishedAt,
        author: authorSchema,
        publisher: { '@id': `${SITE_URL}/#organization` },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${SITE_URL}/${article.category.slug}/${article.slug}`,
        },
        articleSection: article.category.name,
        keywords: article.tags.join(', '),
        inLanguage: 'en-IN',
        isAccessibleForFree: true,
        ...(citations.length > 0
          ? {
              isBasedOn: citations.length === 1 ? citations[0] : citations,
              citation: citations,
            }
          : {}),
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['h1', '#article-body'],
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
    : category
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
            name: category.name,
            item: `${SITE_URL}/${category.slug}`,
          },
        ],
      }
    : null;

  const categoryCollectionSchema = category
    ? {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/${category.slug}#collection`,
        url: `${SITE_URL}/${category.slug}`,
        name: category.name,
        description: category.description,
        publisher: { '@id': `${SITE_URL}/#organization` },
        ...(categoryArticles && categoryArticles.length > 0
          ? {
              mainEntity: {
                '@type': 'ItemList',
                itemListElement: categoryArticles.slice(0, 10).map((art, idx) => ({
                  '@type': 'ListItem',
                  position: idx + 1,
                  url: `${SITE_URL}/${art.category.slug}/${art.slug}`,
                  name: art.title,
                })),
              },
            }
          : {}),
      }
    : null;

  const schemas = [
    organizationSchema,
    websiteSchema,
    ...(articleSchema ? [articleSchema] : []),
    ...(breadcrumbSchema ? [breadcrumbSchema] : []),
    ...(categoryCollectionSchema ? [categoryCollectionSchema] : []),
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
