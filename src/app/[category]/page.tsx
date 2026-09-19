import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCategoryBySlug, getPublishedArticlesByCategory } from '@/lib/articles';
import { formatRelativeTime, formatReadingTime, truncate, deduplicateArticles } from '@/lib/utils';
import { categoryMetadata } from '@/lib/seo/metadata';
import AdSlot from '@/components/shared/AdSlot';
import ArticleImage from '@/components/shared/ArticleImage';
import { ArrowRight } from 'lucide-react';
import styles from './category.module.css';

// ISR: edge-cached, revalidated on publish via revalidateNewsPublication().
export const revalidate = 300;
export const dynamicParams = true;

const ARTICLES_PER_PAGE = 24;

interface Props {
  params: Promise<{ category: string }>;
  searchParams?: Promise<{ page?: string }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const sParams = searchParams ? await searchParams : {};
  const pageNumber = Math.max(1, parseInt(sParams.page || '1', 10) || 1);

  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  const articles = await getPublishedArticlesByCategory(slug);
  const baseMeta = categoryMetadata(category, articles.length > 0);

  if (pageNumber > 1) {
    return {
      ...baseMeta,
      title: { absolute: `${category.name} News - Page ${pageNumber} | Briefy.live` },
      alternates: { canonical: siteUrl(`/${category.slug}?page=${pageNumber}`) },
    };
  }

  return baseMeta;
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category: slug } = await params;
  const sParams = searchParams ? await searchParams : {};
  const pageNumber = Math.max(1, parseInt(sParams.page || '1', 10) || 1);

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const rawArticles = await getPublishedArticlesByCategory(slug);
  const categoryArticles = deduplicateArticles(rawArticles);

  const totalPages = Math.ceil(categoryArticles.length / ARTICLES_PER_PAGE) || 1;
  const paginatedArticles = categoryArticles.slice(
    (pageNumber - 1) * ARTICLES_PER_PAGE,
    pageNumber * ARTICLES_PER_PAGE
  );

  const [featured, ...rest] = pageNumber === 1 ? paginatedArticles : [null, ...paginatedArticles];
  const featuredUrl = featured ? `/${featured.category.slug}/${featured.slug}` : '';

  return (
    <div className={styles.page}>
      <div className="container">

        {/* Page Header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.categoryTitle}>{category.name}</h1>
          <p className={styles.categoryDesc}>{category.description}</p>
        </div>

        {categoryArticles.length === 0 && (
          <div className={styles.emptyState}>
            <p>No stories published in this section yet. Check back soon.</p>
            <Link href="/">← Back to homepage</Link>
          </div>
        )}

        {categoryArticles.length > 0 && (
          <>
            {/* Featured (on page 1 only) */}
            {featured && (
              <article className={styles.featured}>
                <Link href={featuredUrl} className={styles.featuredImageWrapper} tabIndex={-1} aria-hidden="true">
                  <ArticleImage
                    src={featured.featuredImage}
                    alt={featured.imageAlt}
                    category={category.name}
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

            {/* Ad */}
            <div style={{ padding: '1.5rem 0' }}>
              <AdSlot id={`ad-category-${slug}`} width={728} height={90} />
            </div>

            {/* Article Grid */}
            <section aria-label={`All ${category.name} articles`}>
              <h2 className="section-heading">
                {pageNumber === 1 ? `Latest in ${category.name}` : `${category.name} Stories — Page ${pageNumber}`}
              </h2>
              <div className={styles.grid}>
                {rest.map((article) => {
                  if (!article) return null;
                  const url = `/${article.category.slug}/${article.slug}`;
                  return (
                    <article key={article.id} className={styles.card}>
                      <Link href={url} className={styles.cardImageWrapper} tabIndex={-1} aria-hidden="true">
                        <ArticleImage
                          src={article.featuredImage}
                          alt={article.imageAlt}
                          category={category.name}
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

              {/* Crawlable Pagination */}
              {totalPages > 1 && (
                <nav className={styles.pagination} aria-label="Category pagination" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2.5rem' }}>
                  {pageNumber > 1 && (
                    <Link
                      href={pageNumber === 2 ? `/${slug}` : `/${slug}?page=${pageNumber - 1}`}
                      className="pagination-prev"
                    >
                      ← Previous Page
                    </Link>
                  )}
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', alignSelf: 'center' }}>
                    Page {pageNumber} of {totalPages}
                  </span>
                  {pageNumber < totalPages && (
                    <Link
                      href={`/${slug}?page=${pageNumber + 1}`}
                      className="pagination-next"
                    >
                      Next Page →
                    </Link>
                  )}
                </nav>
              )}
            </section>
          </>
        )}

      </div>
    </div>
  );
}
