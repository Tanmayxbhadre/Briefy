import Link from 'next/link';
import { Article } from '@/lib/types';
import { formatDate, formatReadingTime, truncate, deduplicateArticles, formatCategoryName } from '@/lib/utils';
import ArticleImage from '@/components/shared/ArticleImage';
import { ArrowRight } from 'lucide-react';
import styles from './CategorySection.module.css';

interface CategorySectionProps {
  categoryName: string;
  categorySlug: string;
  articles: Article[];
}

export default function CategorySection({ categoryName, categorySlug, articles }: CategorySectionProps) {
  const uniqueArticles = deduplicateArticles(articles);
  if (!uniqueArticles.length) return null;

  const [primary, ...rest] = uniqueArticles;
  const primaryUrl = `/${primary.category.slug}/${primary.slug}`;
  const displayName = formatCategoryName(categorySlug, categoryName);

  return (
    <section className={styles.section} aria-label={`${displayName} news`}>
      <div className={styles.header}>
        <h2 className="section-heading">
          <span>{displayName}</span>
          <Link href={`/${categorySlug}`} className={styles.viewAllLink} aria-label={`View all in ${displayName}`}>
            <span>View all in {displayName}</span>
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </h2>
      </div>

      <div className={`${styles.grid} ${rest.length === 0 ? styles.gridSingle : ''}`}>
        {/* Primary story */}
        <article className={styles.primary}>
          <Link href={primaryUrl} className={styles.imageWrapper} tabIndex={-1} aria-hidden="true">
            <ArticleImage
              src={primary.featuredImage}
              alt={primary.imageAlt}
              category={displayName}
              fill
              sizes={rest.length === 0 ? "(max-width: 767px) 100vw, 50vw" : "(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 40vw"}
              className={styles.image}
              loading="lazy"
            />
          </Link>
          <div className={styles.primaryContent}>
            <Link href={`/${primary.category.slug}`} className="category-tag">
              {displayName}
            </Link>
            <h3 className={styles.primaryHeadline}>
              <Link href={primaryUrl}>{primary.title}</Link>
            </h3>
            {primary.description && (
              <p className={styles.primaryDesc}>{truncate(primary.description, rest.length === 0 ? 220 : 160)}</p>
            )}
            <div className={styles.primaryMeta}>
              <time dateTime={primary.publishedAt}>{formatDate(primary.publishedAt)}</time>
              <span aria-hidden="true">·</span>
              <span>{formatReadingTime(primary.readingTime)}</span>
            </div>
            <div className={styles.primaryCta}>
              <Link href={primaryUrl} className={styles.readMoreLink} aria-label={`Read story: ${primary.title}`}>
                <span>Read Story</span>
                <ArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </article>

        {/* Secondary stories with thumbnails (only when rest has stories) */}
        {rest.length > 0 && (
          <div className={styles.secondaryList}>
            {rest.slice(0, 3).map((article, i) => {
              const url = `/${article.category.slug}/${article.slug}`;
              return (
                <article key={article.id} className={styles.secondary}>
                  {i > 0 && <div className={styles.sep} aria-hidden="true" />}
                  <div className={styles.secondaryInner}>
                    <div className={styles.secondaryText}>
                      <h3 className={styles.secondaryHeadline}>
                        <Link href={url}>{article.title}</Link>
                      </h3>
                      <div className={styles.secondaryMeta}>
                        <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
                        <span aria-hidden="true">·</span>
                        <span>{formatReadingTime(article.readingTime)}</span>
                      </div>
                    </div>
                    <Link href={url} className={styles.secondaryImageWrapper} tabIndex={-1} aria-hidden="true">
                      <ArticleImage
                        src={article.featuredImage}
                        alt={article.imageAlt}
                        category={displayName}
                        fill
                        sizes="80px"
                        className={styles.secondaryImage}
                        loading="lazy"
                      />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
