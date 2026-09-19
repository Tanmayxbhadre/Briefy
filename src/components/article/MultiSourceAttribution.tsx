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

  const isSingleSource = validSources.length === 1;

  return (
    <section className={styles.container} aria-labelledby="article-sources-heading">
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>Editorial Transparency</p>
          <h2 id="article-sources-heading" className={styles.heading}>
            {isSingleSource ? 'Original Source' : 'Reporting Sources'}
          </h2>
        </div>
        <span className={styles.count}>
          {isSingleSource ? '1 reporting source' : `${validSources.length} reporting sources`}
        </span>
      </div>
      <p className={styles.description}>
        {isSingleSource
          ? `This article was synthesized from coverage published by ${validSources[0].name}.`
          : 'This article was synthesized from reporting published by the following sources:'}
      </p>
      <ul className={styles.sourcesList}>
        {validSources.map((source) => (
          <li key={`${source.name}-${source.url}`}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.sourceLink}
              aria-label={`Read original coverage from ${source.name}`}
            >
              <span>{source.name}</span>
              <ExternalLink aria-hidden="true" className={styles.arrow} />
            </a>
          </li>
        ))}
      </ul>
      <p className={styles.note}>
        Original reporting links are provided for attribution and reader verification. Consult the original publisher for complete coverage.
      </p>
    </section>
  );
}
