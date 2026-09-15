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
      <span className={styles.wordmark} aria-hidden={compact ? 'true' : undefined}>
        Briefy<span className={styles.dot}>.</span><span className={styles.live}>live</span>
      </span>
      {compact && <span className="sr-only">{label}</span>}
    </span>
  );

  return href ? <Link href={href} aria-label={label}>{content}</Link> : content;
}
