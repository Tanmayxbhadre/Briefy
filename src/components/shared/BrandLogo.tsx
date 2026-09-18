'use client';

import Link from 'next/link';
import Image from 'next/image';
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
      <Image
        src="/briefy-logo.png"
        alt="Briefy.live"
        width={120}
        height={40}
        className={`${styles.logoImage} ${theme === 'dark' ? styles.logoImageDark : ''}`}
        priority
      />
      {compact && <span className="sr-only">{label}</span>}
    </span>
  );

  return href ? <Link href={href} aria-label={label}>{content}</Link> : content;
}
