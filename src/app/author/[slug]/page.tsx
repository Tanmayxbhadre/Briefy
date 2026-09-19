import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAuthorProfile } from '@/config/authors';
import { getAllPublishedArticles } from '@/lib/articles';
import { SITE_NAME, SITE_URL, siteUrl } from '@/lib/site';
import { formatRelativeTime, formatReadingTime, truncate, deduplicateArticles } from '@/lib/utils';
import ArticleImage from '@/components/shared/ArticleImage';
import { ArrowRight, User } from 'lucide-react';
import styles from '@/app/[category]/category.module.css';

export const revalidate = 300;
export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = getAuthorProfile(slug);
  if (!author) return {};

  const title = `${author.name} — ${author.role} | ${SITE_NAME}`;
  const description = `${author.bio} Read the latest reporting and analysis by ${author.name} on Briefy.live.`;
  const canonical = siteUrl(`/author/${author.slug}`);

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      url: canonical,
      type: 'profile',
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

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const author = getAuthorProfile(slug);
  if (!author) {
    notFound();
  }

  const allArticles = await getAllPublishedArticles();
  const authorArticles = deduplicateArticles(
    allArticles.filter(
      (a) =>
        a.author.slug.toLowerCase() === author.slug.toLowerCase() ||
        a.author.name.toLowerCase() === author.name.toLowerCase()
    )
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${SITE_URL}/author/${author.slug}#profile`,
    url: `${SITE_URL}/author/${author.slug}`,
    name: `${author.name} — Profile & Reporting`,
    mainEntity: {
      '@type': 'Person',
      name: author.name,
      jobTitle: author.role,
      description: author.bio,
      url: `${SITE_URL}/author/${author.slug}`,
      worksFor: {
        '@type': 'NewsMediaOrganization',
        name: SITE_NAME,
        url: SITE_URL,
      },
      sameAs: author.sameAs || [],
    },
  };

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container">
        {/* Author Bio Header */}
        <div className={styles.pageHeader} style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)', paddingBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-bg-card)',
                border: '2px solid var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-accent)',
              }}
            >
              <User size={32} />
            </div>
            <div>
              <h1 className={styles.categoryTitle} style={{ margin: 0, fontSize: '2rem' }}>{author.name}</h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '1rem', color: 'var(--color-accent)', fontWeight: 600 }}>
                {author.role}
              </p>
            </div>
          </div>
          <p className={styles.categoryDesc} style={{ maxWidth: '800px' }}>
            {author.bio}
          </p>
          {author.sameAs && author.sameAs.length > 0 && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
              {author.sameAs.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}
                >
                  Verified Social Profile ↗
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Author Articles Grid */}
        <section aria-label={`Articles by ${author.name}`} style={{ marginTop: '2.5rem' }}>
          <h2 className="section-heading">
            {authorArticles.length > 0 ? `Reporting by ${author.name}` : `Recent Coverage`}
          </h2>

          {authorArticles.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Articles authored or edited by {author.name} will appear here as stories are published.</p>
              <Link href="/">← Return to homepage</Link>
            </div>
          ) : (
            <div className={styles.grid}>
              {authorArticles.map((article) => {
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
                      <div className="category-tag" style={{ marginBottom: '8px' }}>
                        {article.category.name}
                      </div>
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
          )}
        </section>
      </div>
    </div>
  );
}
