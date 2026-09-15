'use client';

import Link from 'next/link';
import styles from './BrandLogo.module.css';

interface BrandLogoProps {
  href?: string;
  compact?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
}

export default function BrandLogo({
  href = '/',
  compact = false,
  theme = 'light',
  className = '',
}: BrandLogoProps) {
  const label = 'Briefy.live — Home';
  const content = (
    <span className={`${styles.logo} ${compact ? styles.compact : ''} ${theme === 'dark' ? styles.dark : ''} ${className}`}>
      <span className={styles.mark} aria-hidden="true">
        <svg viewBox="0 0 32 32" role="presentation">
          <path d="M7 4h11.5a7.5 7.5 0 0 1 0 15H12v9H7V4Zm5 5v5h6.25a2.5 2.5 0 0 0 0-5H12Zm0 10v4h6.25a2 2 0 0 0 0-4H12Z" fill="currentColor" />
          <path d="M25 4h2v24h-2z" fill="var(--brand-accent)" />
        </svg>
      </span>
      <span className={styles.wordmark} aria-hidden={compact ? 'true' : undefined}>
        Briefy<span className={styles.dot}>.</span><span className={styles.live}>live</span>
      </span>
      {compact && <span className="sr-only">{label}</span>}
    </span>
  );

  return href ? <Link href={href} aria-label={label}>{content}</Link> : content;
}
