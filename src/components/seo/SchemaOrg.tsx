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

  const activePageType = pageType || (article ? 'article' : category ? 'category' : 'home');

  let datePublishedIso = new Date().toISOString();
  try {
    if (article?.publishedAt) {
      datePublishedIso = new Date(article.publishedAt).toISOString();
    }
  } catch {}

  let dateModifiedIso = datePublishedIso;
  try {
    if (article?.updatedAt || article?.publishedAt) {
      dateModifiedIso = new Date(article.updatedAt || article.publishedAt).toISOString();
    }
  } catch {}

  const articleImages: string[] = [];
  if (article?.featuredImage) {
    if (article.featuredImage.includes('images.unsplash.com')) {
      const base = article.featuredImage.split('?')[0];
      articleImages.push(
        `${base}?w=1200&h=675&fit=crop`,
        `${base}?w=1200&h=900&fit=crop`,
        `${base}?w=1200&h=1200&fit=crop`
      );
    } else {
      articleImages.push(
        article.featuredImage,
        `${SITE_URL}/api/og?title=${encodeURIComponent(article.title)}&category=${encodeURIComponent(article.category.name)}`
      );
    }
  } else {
    articleImages.push(`${SITE_URL}/briefy-logo.png`);
  }

  const articleSchema = article
    ? {
        '@type': 'NewsArticle',
        '@id': `${SITE_URL}/${article.category.slug}/${article.slug}`,
        headline: article.title.slice(0, 110),
        description: article.metaDescription || article.description,
        image: articleImages,
        datePublished: datePublishedIso,
        dateModified: dateModifiedIso,
        author: authorSchema,
        publisher: {
          '@type': 'NewsMediaOrganization',
          '@id': `${SITE_URL}/#organization`,
          name: SITE_NAME,
          url: SITE_URL,
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/favicon.png`,
            width: 512,
            height: 512,
          },
        },
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
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/${category.slug}#collection`,
        url: `${SITE_URL}/${category.slug}`,
        name: `${category.name} News & Analysis`,
        description: category.description,
        publisher: {
          '@type': 'NewsMediaOrganization',
          '@id': `${SITE_URL}/#organization`,
          name: SITE_NAME,
          url: SITE_URL,
        },
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

  // Render appropriate schemas based on activePageType to prevent duplicates
  const schemasToRender: object[] = [];

  if (activePageType === 'home') {
    schemasToRender.push(organizationSchema, websiteSchema);
  } else if (activePageType === 'article') {
    if (articleSchema) schemasToRender.push(articleSchema);
    if (breadcrumbSchema) schemasToRender.push(breadcrumbSchema);
  } else if (activePageType === 'category') {
    if (categoryCollectionSchema) schemasToRender.push(categoryCollectionSchema);
    if (breadcrumbSchema) schemasToRender.push(breadcrumbSchema);
  } else {
    // Default fallback
    schemasToRender.push(organizationSchema, websiteSchema);
    if (articleSchema) schemasToRender.push(articleSchema);
    if (breadcrumbSchema) schemasToRender.push(breadcrumbSchema);
    if (categoryCollectionSchema) schemasToRender.push(categoryCollectionSchema);
  }

  if (schemasToRender.length === 0) return null;

  const graphJson = {
    '@context': 'https://schema.org',
    '@graph': schemasToRender,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graphJson) }}
    />
  );
}
