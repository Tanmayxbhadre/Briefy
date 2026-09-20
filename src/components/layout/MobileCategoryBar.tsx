'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MOBILE_RAIL_CATEGORIES } from '@/lib/categories';
import styles from './MobileCategoryBar.module.css';

export default function MobileCategoryBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav className={styles.container} aria-label="Category quick navigation">
      <div className={styles.fadeLeft} aria-hidden="true" />
      <div className={styles.scrollRail}>
        {MOBILE_RAIL_CATEGORIES.map((cat) => {
          const active = isActive(cat.href);
          return (
            <Link
              key={cat.href}
              href={cat.href}
              className={`${styles.chip} ${active ? styles.chipActive : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {cat.label}
            </Link>
          );
        })}
      </div>
      <div className={styles.fadeRight} aria-hidden="true" />
    </nav>
  );
}
