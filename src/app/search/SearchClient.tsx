'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search as SearchIcon } from 'lucide-react';
import { formatRelativeTime, formatReadingTime } from '@/lib/utils';
import styles from './search.module.css';

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: { name: string; slug: string };
  author: { name: string };
  publishedAt: string;
  readingTime: number;
  url: string;
}

function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [input, setInput] = useState(query);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then((res) => (res.ok ? res.json() : { results: [] }))
      .then((data) => {
        if (!cancelled) setResults(data.results ?? []);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      router.push(`/search?q=${encodeURIComponent(input.trim())}`);
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">

        {/* Search Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Search</h1>

          <form onSubmit={handleSearch} className={styles.form} role="search">
            <label htmlFor="search-input" className="sr-only">Search news</label>
            <div className={styles.inputWrapper}>
              <SearchIcon size={18} strokeWidth={1.75} className={styles.searchIcon} aria-hidden="true" />
              <input
                id="search-input"
                type="search"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search news, topics, categories…"
                className={styles.input}
                autoFocus
              />
            </div>
            <button type="submit" className={styles.btn}>Search</button>
          </form>
        </div>

        {/* Results */}
        {query && (
          <div className={styles.results}>
            <p className={styles.resultCount}>
              {loading
                ? 'Searching…'
                : results
                  ? `${results.length} result${results.length !== 1 ? 's' : ''} for &ldquo;${query}&rdquo;`
                  : ''}
            </p>

            {!loading && results && results.length === 0 && (
              <div className={styles.empty}>
                <p>No articles found. Try a different search term.</p>
              </div>
            )}

            {!loading && results && results.length > 0 && (
              <div className={styles.list}>
                {results.map((article) => (
                  <article key={article.id} className={styles.resultItem}>
                    <Link href={`/${article.category.slug}`} className="category-tag">
                      {article.category.name}
                    </Link>
                    <h2 className={styles.resultHeadline}>
                      <Link href={article.url}>{article.title}</Link>
                    </h2>
                    <p className={styles.resultDesc}>{article.description}</p>
                    <div className={styles.resultMeta}>
                      <span>{article.author.name}</span>
                      <span>·</span>
                      <time dateTime={article.publishedAt}>{formatRelativeTime(article.publishedAt)}</time>
                      <span>·</span>
                      <span>{formatReadingTime(article.readingTime)}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {!query && (
          <div className={styles.empty}>
            <p>Enter a search term to find articles.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchClient() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ padding: '5rem 0', color: 'var(--color-text-muted)' }}>
          Loading…
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
