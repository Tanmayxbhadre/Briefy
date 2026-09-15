import { Source } from '@/lib/types';
import { ExternalLink } from 'lucide-react';
import styles from './MultiSourceAttribution.module.css';

interface MultiSourceAttributionProps {
  sources?: Source[];
}

function getValidSources(sources: Source[]) {
  const seen = new Set<string>();

  return sources.filter((source) => {
    if (!source.name.trim() || !source.url) return false;

    try {
      const url = new URL(source.url);
      if (!['http:', 'https:'].includes(url.protocol)) return false;
      const key = `${source.name.trim().toLocaleLowerCase()}|${url.href}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    } catch {
      return false;
    }
  });
}

export default function MultiSourceAttribution({ sources }: MultiSourceAttributionProps) {
  const validSources = getValidSources(sources ?? []);
  if (validSources.length === 0) return null;

  return (
    <section className={styles.container} aria-labelledby="article-sources-heading">
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>Editorial transparency</p>
          <h2 id="article-sources-heading" className={styles.heading}>
            Sources &amp; cross-verification
          </h2>
        </div>
        <span className={styles.count}>{validSources.length} reporting {validSources.length === 1 ? 'source' : 'sources'}</span>
      </div>
      <p className={styles.description}>
        This article was synthesized and cross-checked against the following reporting sources.
      </p>
      <ul className={styles.sourcesList}>
        {validSources.map((source) => (
          <li key={`${source.name}-${source.url}`}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.sourceLink}
              aria-label={`Read the original report from ${source.name}`}
            >
              <span>{source.name}</span>
              <ExternalLink aria-hidden="true" className={styles.arrow} />
            </a>
          </li>
        ))}
      </ul>
      <p className={styles.note}>
        Source links are provided for transparency. Consult the original reports for complete context.
      </p>
    </section>
  );
}
