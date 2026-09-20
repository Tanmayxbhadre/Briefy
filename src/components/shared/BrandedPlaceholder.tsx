'use client';

import React from 'react';
import styles from './BrandedPlaceholder.module.css';

interface BrandedPlaceholderProps {
  label?: string;
  category?: string;
  compact?: boolean;
  className?: string;
}

export default function BrandedPlaceholder({
  label = 'Briefy News',
  category,
  compact = false,
  className = '',
}: BrandedPlaceholderProps) {
  return (
    <div
      className={`${styles.container} ${compact ? styles.small : ''} ${className}`}
      aria-hidden="true"
    >
      <div className={styles.patternOverlay} aria-hidden="true" />
      <div className={styles.glowOrb} aria-hidden="true" />

      <div className={styles.content}>
        <div className={styles.logoBadge}>
          <span>Briefy</span>
          <span className={styles.dot}>.</span>
          <span className={styles.live}>live</span>
        </div>
        {category && <span className={styles.categoryTag}>{category}</span>}
      </div>
    </div>
  );
}
