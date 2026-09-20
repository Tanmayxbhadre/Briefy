import Link from 'next/link';
import { Article } from '@/lib/types';
import { formatDate, formatReadingTime, truncate, formatCategoryName } from '@/lib/utils';
import ArticleImage from '@/components/shared/ArticleImage';
import { ArrowRight, Flame } from 'lucide-react';
import styles from './HeroSection.module.css';

interface HeroSectionProps {
  featured: Article;
  secondary: Article[];
}

export default function HeroSection({ featured, secondary }: HeroSectionProps) {
  const featuredUrl = `/${featured.category.slug}/${featured.slug}`;
  const featuredCategoryName = formatCategoryName(featured.category.slug, featured.category.name);

  return (
    <section className={styles.hero} aria-label="Lead story and top headlines">
      <div className={styles.grid}>

        {/* Main featured / Lead Story */}
        <article className={styles.main}>
          <Link href={featuredUrl} className={styles.mainImageWrapper} aria-hidden="true" tabIndex={-1}>
            <ArticleImage
              src={featured.featuredImage}
              alt={featured.imageAlt}
              category={featuredCategoryName}
              fill
              priority
              sizes="(max-width: 767px) 100vw, (max-width: 1023px) 100vw, 65vw"
              className={styles.mainImage}
            />
          </Link>
          <div className={styles.mainContent}>
            <div className={styles.tagRow}>
              <span className={styles.leadBadge}>
                <Flame size={12} aria-hidden="true" />
                <span>Lead Story</span>
              </span>
              <Link href={`/${featured.category.slug}`} className={`category-tag ${styles.categoryTag}`}>
                {featuredCategoryName}
              </Link>
            </div>

            <h1 className={styles.mainHeadline}>
              <Link href={featuredUrl}>{featured.title}</Link>
            </h1>

            <p className={styles.mainDescription}>
              {truncate(featured.description, 190)}
            </p>

            <div className={styles.mainMeta}>
              <span className={styles.author}>{featured.author.name}</span>
              <span className={styles.metaDot} aria-hidden="true">·</span>
              <time dateTime={featured.publishedAt}>
                {formatDate(featured.publishedAt)}
              </time>
              <span className={styles.metaDot} aria-hidden="true">·</span>
              <span>{formatReadingTime(featured.readingTime)}</span>
            </div>

            <div className={styles.ctaRow}>
              <Link href={featuredUrl} className={styles.readLink} aria-label={`Read full story: ${featured.title}`}>
                <span>Read Full Story</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </article>

        {/* Secondary stories / Top Headlines rail */}
        <aside className={styles.sidebar} aria-label="Top headlines">
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Top Headlines</h2>
          </div>

          <div className={styles.secondaryList}>
            {secondary.slice(0, 3).map((article, i) => {
              const url = `/${article.category.slug}/${article.slug}`;
              return (
                <article key={article.id} className={styles.secondary}>
                  {i > 0 && <div className={styles.separator} aria-hidden="true" />}
                  <div className={styles.secondaryInner}>
                    <div className={styles.secondaryText}>
                      <Link href={`/${article.category.slug}`} className="category-tag">
                        {formatCategoryName(article.category.slug, article.category.name)}
                      </Link>
                      <h3 className={styles.secondaryHeadline}>
                        <Link href={url}>{article.title}</Link>
                      </h3>
                      <div className={styles.secondaryMeta}>
                        <time dateTime={article.publishedAt}>
                          {formatDate(article.publishedAt)}
                        </time>
                        <span className={styles.metaDot} aria-hidden="true">·</span>
                        <span>{formatReadingTime(article.readingTime)}</span>
                      </div>
                    </div>
                    <Link href={url} className={styles.secondaryImageWrapper} tabIndex={-1} aria-hidden="true">
                      <ArticleImage
                        src={article.featuredImage}
                        alt={article.imageAlt}
                        category={formatCategoryName(article.category.slug, article.category.name)}
                        fill
                        sizes="120px"
                        className={styles.secondaryImage}
                        loading="lazy"
                      />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </aside>

      </div>
    </section>
  );
}
