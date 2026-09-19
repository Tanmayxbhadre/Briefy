import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTopicBySlug } from '@/lib/articles';
import { SITE_NAME, SITE_URL, siteUrl } from '@/lib/site';
import { formatRelativeTime, formatReadingTime, truncate } from '@/lib/utils';
import ArticleImage from '@/components/shared/ArticleImage';
import { ArrowRight } from 'lucide-react';
import styles from '@/app/[category]/category.module.css';

export const revalidate = 300;
export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const topic = await getTopicBySlug(slug);
  if (!topic) return {};

  const title = `${topic.name} News & Latest Updates | ${SITE_NAME}`;
  const description = `Explore curated, multi-source reporting and in-depth updates on ${topic.name} from Briefy.live.`;
  const canonical = siteUrl(`/topic/${topic.slug}`);
  const isIndexable = topic.count >= 5;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: isIndexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      url: canonical,
      type: 'website',
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@briefylive',
      title,
      description,
    },
  };
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const topic = await getTopicBySlug(slug);
  if (!topic || topic.articles.length === 0) {
    notFound();
  }

  const [featured, ...rest] = topic.articles;
  const featuredUrl = featured ? `/${featured.category.slug}/${featured.slug}` : '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_URL}/topic/${topic.slug}#collection`,
    url: `${SITE_URL}/topic/${topic.slug}`,
    name: `${topic.name} News & Coverage`,
    description: `Latest news and reporting on ${topic.name}`,
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: topic.articles.slice(0, 10).map((art, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${SITE_URL}/${art.category.slug}/${art.slug}`,
        name: art.title,
      })),
    },
  };

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container">
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div style={{ marginBottom: '8px', fontSize: '0.875rem', color: 'var(--color-accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Topic Archive
          </div>
          <h1 className={styles.categoryTitle}>{topic.name}</h1>
          <p className={styles.categoryDesc}>
            Comprehensive coverage, timeline developments, and verified reporting on {topic.name}.
          </p>
        </div>

        {/* Featured Story */}
        {featured && (
          <article className={styles.featured}>
            <Link href={featuredUrl} className={styles.featuredImageWrapper} tabIndex={-1} aria-hidden="true">
              <ArticleImage
                src={featured.featuredImage}
                alt={featured.imageAlt}
                category={featured.category.name}
                fill
                priority
                sizes="(max-width: 767px) 100vw, 60vw"
                style={{ objectFit: 'cover' }}
              />
            </Link>
            <div className={styles.featuredContent}>
              <Link href={`/${featured.category.slug}`} className="category-tag">
                {featured.category.name}
              </Link>
              <h2 className={styles.featuredHeadline}>
                <Link href={featuredUrl}>{featured.title}</Link>
              </h2>
              {featured.description && (
                <p className={styles.featuredDesc}>{truncate(featured.description, 180)}</p>
              )}
              <div className={styles.featuredMeta}>
                <span>{featured.author.name}</span>
                <span>·</span>
                <time dateTime={featured.publishedAt}>{formatRelativeTime(featured.publishedAt)}</time>
                <span>·</span>
                <span>{formatReadingTime(featured.readingTime)}</span>
              </div>
            </div>
          </article>
        )}

        {/* Rest of Topic Stories */}
        {rest.length > 0 && (
          <section aria-label={`More articles on ${topic.name}`} style={{ marginTop: '2.5rem' }}>
            <h2 className="section-heading">All Stories in {topic.name}</h2>
            <div className={styles.grid}>
              {rest.map((article) => {
                const url = `/${article.category.slug}/${article.slug}`;
                return (
                  <article key={article.id} className={styles.card}>
                    <Link href={url} className={styles.cardImageWrapper} tabIndex={-1} aria-hidden="true">
                      <ArticleImage
                        src={article.featuredImage}
                        alt={article.imageAlt}
                        category={article.category.name}
                        fill
                        sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                        style={{ objectFit: 'cover' }}
                        loading="lazy"
                      />
                    </Link>
                    <div className={styles.cardContent}>
                      <h3 className={styles.cardHeadline}>
                        <Link href={url}>{article.title}</Link>
                      </h3>
                      {article.description && (
                        <p className={styles.cardDesc}>{truncate(article.description, 120)}</p>
                      )}
                      <div className={styles.cardMeta}>
                        <time dateTime={article.publishedAt}>{formatRelativeTime(article.publishedAt)}</time>
                        <span>·</span>
                        <span>{formatReadingTime(article.readingTime)}</span>
                      </div>
                      <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                        <Link href={url} className="read-brief-cta" style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--color-accent)',
                          minHeight: '36px',
                        }}>
                          <span>Read Story</span>
                          <ArrowRight size={12} aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
