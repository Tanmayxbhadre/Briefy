import Link from 'next/link';
import { Article } from '@/lib/types';
import { slugifyTag } from '@/lib/articles';
import styles from './ArticleBody.module.css';

interface ArticleBodyProps {
  article: Article;
  eligibleTopicSlugs?: Set<string>;
}

/**
 * Renders inline markdown-ish formatting: [text](url) links and **bold**.
 * AI-generated articles previously couldn't carry contextual internal links
 * — a significant news-SEO gap — because only headings/blockquotes were
 * parsed.
 */
function renderInline(text: string): React.ReactNode[] {
  // Split on links first, then bold within each fragment.
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);

  return parts.map((part, i) => {
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      const isInternal = href.startsWith('/');
      return isInternal ? (
        <Link key={i} href={href} className={styles.inlineLink}>
          {label}
        </Link>
      ) : (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.inlineLink}
        >
          {label}
        </a>
      );
    }

    // **bold** within non-link fragments
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bp, j) => {
      if (bp.startsWith('**') && bp.endsWith('**') && bp.length > 4) {
        return <strong key={`${i}-${j}`}>{bp.slice(2, -2)}</strong>;
      }
      return bp;
    });
  });
}

/**
 * Renders article content.
 * In production, content comes from the AI editorial pipeline as markdown-
 * style text. Supported: ## / ### headings, > blockquotes, [links](url),
 * **bold**, and paragraphs.
 */
export default function ArticleBody({ article, eligibleTopicSlugs }: ArticleBodyProps) {
  const paragraphs = article.content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return (
    <div className="article-container">
      <div className={styles.body}>
        {paragraphs.map((para, i) => {
          if (para.startsWith('## ')) {
            return <h2 key={i} className={styles.h2}>{renderInline(para.slice(3))}</h2>;
          }
          if (para.startsWith('### ')) {
            return <h3 key={i} className={styles.h3}>{renderInline(para.slice(4))}</h3>;
          }
          if (para.startsWith('> ')) {
            return (
              <blockquote key={i} className={styles.blockquote}>
                {renderInline(para.slice(2))}
              </blockquote>
            );
          }
          return <p key={i} className={styles.paragraph}>{renderInline(para)}</p>;
        })}

        {/* Tags — link to /topic/{slug} if tag has >=5 articles; otherwise plain chip */}
        {article.tags.length > 0 && (
          <div className={styles.tags}>
            {article.tags.map((tag) => {
              const slug = slugifyTag(tag);
              const isEligible = eligibleTopicSlugs ? eligibleTopicSlugs.has(slug) : false;

              return isEligible ? (
                <Link
                  key={tag}
                  href={`/topic/${slug}`}
                  className={styles.tag}
                  title={`View all articles on ${tag}`}
                >
                  {tag}
                </Link>
              ) : (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
