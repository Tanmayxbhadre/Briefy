import Link from 'next/link';
import { Article } from '@/lib/types';
import { formatTime, formatRelativeTime, truncate, deduplicateArticles, formatCategoryName } from '@/lib/utils';
import { Clock, ArrowRight } from 'lucide-react';
import styles from './LatestNewsFeed.module.css';

interface LatestNewsFeedProps {
  articles: Article[];
}

export default function LatestNewsFeed({ articles }: LatestNewsFeedProps) {
  const uniqueArticles = deduplicateArticles(articles);

  return (
    <section className={styles.section} aria-label="Latest news feed">
      <div className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <Clock size={16} className={styles.headerIcon} aria-hidden="true" />
          <h2 className={styles.sectionTitle}>Continuous Live Feed</h2>
        </div>
        <Link href="/daily-news" className={styles.seeAllLink}>
          <span>View All Briefs</span>
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>

      <ol className={styles.feed} aria-label="Latest news articles in chronological order">
        {uniqueArticles.map((article) => {
          const url = `/${article.category.slug}/${article.slug}`;
          const isDescDuplicate = !article.description || article.description.trim() === article.title.trim();

          return (
            <li key={article.id} className={styles.item}>
              <div className={styles.timeCol}>
                <span className={styles.relTime}>
                  {formatRelativeTime(article.publishedAt)}
                </span>
                <time
                  dateTime={article.publishedAt}
                  className={styles.time}
                  title={new Date(article.publishedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                >
                  {formatTime(article.publishedAt)} IST
                </time>
              </div>
              <div className={styles.contentCol}>
                <div className={styles.metaRow}>
                  <Link href={`/${article.category.slug}`} className={`category-tag ${styles.cat}`}>
                    {formatCategoryName(article.category.slug, article.category.name)}
                  </Link>
                </div>
                <h3 className={styles.headline}>
                  <Link href={url} className={styles.headlineLink}>
                    {article.title}
                  </Link>
                </h3>
                {!isDescDuplicate && (
                  <p className={styles.description}>
                    {truncate(article.description, 135)}
                  </p>
                )}
                <div className={styles.cardAction}>
                  <Link href={url} className={styles.actionBtn} aria-label={`Read brief: ${article.title}`}>
                    <span>Read Brief</span>
                    <ArrowRight size={12} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
