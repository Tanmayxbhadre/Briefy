import Link from 'next/link';
import { Article } from '@/lib/types';
import { deduplicateArticles, formatCategoryName } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';
import styles from './TrendingSection.module.css';

interface TrendingSectionProps {
  articles: Article[];
}

export default function TrendingSection({ articles }: TrendingSectionProps) {
  const uniqueArticles = deduplicateArticles(articles).slice(0, 5);

  return (
    <aside className={styles.section} aria-label="Trending stories">
      <div className={styles.header}>
        <TrendingUp size={16} className={styles.headerIcon} aria-hidden="true" />
        <h2 className={styles.title}>Trending Now</h2>
      </div>

      <ol className={styles.list}>
        {uniqueArticles.map((article, i) => {
          const url = `/${article.category.slug}/${article.slug}`;
          const num = String(i + 1).padStart(2, '0');

          return (
            <li key={article.id} className={styles.item}>
              <span className={styles.number} aria-hidden="true">{num}</span>
              <div className={styles.content}>
                <Link href={`/${article.category.slug}`} className="category-tag">
                  {formatCategoryName(article.category.slug, article.category.name)}
                </Link>
                <h3 className={styles.headline}>
                  <Link href={url} className={styles.headlineLink}>
                    {article.title}
                  </Link>
                </h3>
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
