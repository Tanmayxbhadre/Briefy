import Link from 'next/link';
import { Article } from '@/lib/types';
import styles from './ArticleBody.module.css';

interface ArticleBodyProps {
  article: Article;
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
export default function ArticleBody({ article }: ArticleBodyProps) {
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

        {/* Sources */}
        {article.sources && article.sources.length > 0 && (
          <div className={styles.sources}>
            <h2 className={styles.sourcesHeading}>Sources</h2>
            <ul className={styles.sourceList}>
              {article.sources.map((source, i) => (
                <li key={i}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sourceLink}
                  >
                    {source.name} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tags — real internal links to search, not inert spans */}
        {article.tags.length > 0 && (
          <div className={styles.tags}>
            {article.tags.map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className={styles.tag}
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
