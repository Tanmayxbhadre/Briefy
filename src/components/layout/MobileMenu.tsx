'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, Search, Sparkles, Newspaper, Compass } from 'lucide-react';
import BrandLogo from '@/components/shared/BrandLogo';
import { SITE_CATEGORIES } from '@/lib/categories';
import styles from './MobileMenu.module.css';

interface MobileMenuProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  currentPath?: string;
}

export default function MobileMenu({ id, isOpen, onClose, currentPath }: MobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Close on Escape key and trap focus within the modal dialog
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement | null;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && menuRef.current) {
        const focusables = menuRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKey);

    const timer = setTimeout(() => {
      if (menuRef.current) {
        const first = menuRef.current.querySelector<HTMLElement>('button, a');
        first?.focus();
      }
    }, 50);

    return () => {
      document.removeEventListener('keydown', handleKey);
      clearTimeout(timer);
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose]);

  const isActive = (href: string) => {
    if (!currentPath) return false;
    if (href === '/') return currentPath === '/';
    return currentPath === href || currentPath.startsWith(href + '/');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu panel */}
      <div
        ref={menuRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!isOpen}
        inert={!isOpen ? true : undefined}
        className={`${styles.menu} ${isOpen ? styles.menuOpen : ''}`}
      >
        <div className={styles.menuHeader}>
          <BrandLogo className={styles.menuTitle} />
          <button onClick={onClose} className={styles.closeBtn} aria-label="Close menu">
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        <div className={styles.searchRow}>
          <Link href="/search" className={styles.searchLink} onClick={onClose}>
            <Search size={16} strokeWidth={1.75} />
            <span>Search news archive…</span>
          </Link>
        </div>

        <nav className={styles.navContainer} aria-label="Mobile navigation">
          {/* Quick Hubs */}
          <div className={styles.quickHubs}>
            <Link
              href="/daily-news"
              className={`${styles.hubLink} ${isActive('/daily-news') ? styles.hubLinkActive : ''}`}
              onClick={onClose}
            >
              <Newspaper size={16} />
              <span>Today&apos;s Brief</span>
            </Link>
            <Link
              href="/editorial-policy"
              className={`${styles.hubLink} ${isActive('/editorial-policy') ? styles.hubLinkActive : ''}`}
              onClick={onClose}
            >
              <Sparkles size={16} className={styles.aiIcon} />
              <span>Editorial Policy</span>
            </Link>
          </div>

          {/* Unified Category Taxonomy */}
          <div className={styles.categorySectionHeader}>
            <Compass size={14} aria-hidden="true" />
            <p className={styles.navSection}>News Sections</p>
          </div>

          <ul className={styles.categoryList}>
            {SITE_CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/${cat.slug}`}
                  className={`${styles.categoryItem} ${isActive(`/${cat.slug}`) ? styles.categoryItemActive : ''}`}
                  onClick={onClose}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.menuFooter}>
          <Link href="/about" onClick={onClose}>About</Link>
          <Link href="/contact" onClick={onClose}>Contact</Link>
          <Link href="/privacy" onClick={onClose}>Privacy</Link>
          <Link href="/editorial-policy" onClick={onClose}>Standards</Link>
        </div>
      </div>
    </>
  );
}
