import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCategoryBySlug, getPublishedArticlesByCategory } from '@/lib/articles';
import { formatRelativeTime, formatReadingTime } from '@/lib/utils';
import { brandedTitle, SITE_URL } from '@/lib/site';
import styles from '../../category.module.css';
import ArticleImage from '@/components/shared/ArticleImage';

// ISR: edge-cached, revalidated on publish.
export const revalidate = 300;
export const dynamicParams = true;

interface Props {
  params: Promise<{ category: string; page: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug, page } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  const pageNum = parseInt(page, 10);
  if (!Number.isInteger(pageNum) || pageNum < 2) return {};

  return {
    // Archive pages must NOT duplicate the canonical category page.
    title: { absolute: brandedTitle(`${category.name} News | Page ${pageNum}`) },
    description: `Archive of ${category.name} news from Briefy.live, page ${pageNum}.`,
    // Rel canonical points to the page-1 category URL; page 2+ is marked
    // noindex (indexed archives of thin, duplicated listings dilute quality).
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE_URL}/${slug}` },
  };
}

export default async function CategoryArchivePage({ params }: Props) {
  const { category: slug, page } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const pageNum = parseInt(page, 10);
  if (!Number.isInteger(pageNum) || pageNum < 2) notFound();

  const categoryArticles = await getPublishedArticlesByCategory(slug);
  const ARTICLES_PER_PAGE = 24;
  const start = (pageNum - 1) * ARTICLES_PER_PAGE;
  const pageArticles = categoryArticles.slice(start, start + ARTICLES_PER_PAGE);

  if (pageArticles.length === 0) notFound();

  const hasPrev = pageNum > 2;
  const hasNext = start + ARTICLES_PER_PAGE < categoryArticles.length;

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.pageHeader}>
          <h1 className={styles.categoryTitle}>{category.name}</h1>
          <p className={styles.categoryDesc}>
            Archive — page {pageNum}
          </p>
        </div>

        <div className={styles.grid}>
          {pageArticles.map((article) => {
            const url = `/${article.category.slug}/${article.slug}`;
            return (
              <article key={article.id} className={styles.card}>
                <Link href={url} className={styles.cardImageWrapper} tabIndex={-1} aria-hidden="true">
                  <ArticleImage
                    src={article.featuredImage}
                    alt={article.imageAlt}
                    fill
                    sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                    loading="lazy"
                  />
                </Link>
                <div className={styles.cardContent}>
                  <h2 className={styles.cardHeadline}>
                    <Link href={url}>{article.title}</Link>
                  </h2>
                  <p className={styles.cardDesc}>{article.description}</p>
                  <div className={styles.cardMeta}>
                    <time dateTime={article.publishedAt}>{formatRelativeTime(article.publishedAt)}</time>
                    <span>·</span>
                    <span>{formatReadingTime(article.readingTime)}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <nav className={styles.pagination} aria-label="Archive pages">
          {hasPrev && <Link href={`/${slug}/page/${pageNum - 1}`}>← Newer</Link>}
          {hasNext && <Link href={`/${slug}/page/${pageNum + 1}`}>Older →</Link>}
        </nav>

        <p style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link href={`/${slug}`} style={{ color: 'var(--color-accent)' }}>
            ← Back to {category.name}
          </Link>
        </p>
      </div>
    </div>
  );
}
