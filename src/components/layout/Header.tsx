'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Menu, X, Sparkles } from 'lucide-react';
import MobileMenu from './MobileMenu';
import MobileCategoryBar from './MobileCategoryBar';
import BrandLogo from '@/components/shared/BrandLogo';
import { HEADER_NAV_LINKS } from '@/lib/categories';
import styles from './Header.module.css';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Close mobile menu on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <header
        className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}
        role="banner"
      >
        <div className={`container ${styles.inner}`}>

          {/* Logo & Masthead Trust Badge */}
          <div className={styles.logoGroup}>
            <BrandLogo className={styles.logo} />
            <Link
              href="/editorial-policy"
              className={styles.mastheadTrustBadge}
              title="Verified newsroom with AI-assisted research & editorial oversight"
              aria-label="Editorial policy: AI-assisted research with editorial oversight"
            >
              <Sparkles size={11} className={styles.trustSparkle} aria-hidden="true" />
              <span>AI-Assisted Oversight</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className={styles.nav} aria-label="Primary navigation">
            {HEADER_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${isActive(link.href) ? styles.navLinkActive : ''}`}
                aria-current={isActive(link.href) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className={styles.actions}>
            <Link
              href="/search"
              className={`${styles.iconBtn} ${pathname === '/search' ? styles.iconBtnActive : ''}`}
              aria-label="Search"
            >
              <Search size={18} strokeWidth={1.75} />
            </Link>
            <button
              className={`${styles.iconBtn} ${styles.menuToggleBtn}`}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? (
                <X size={20} strokeWidth={1.75} />
              ) : (
                <Menu size={20} strokeWidth={1.75} />
              )}
            </button>
          </div>

        </div>

        {/* Mobile Swipeable Category Bar */}
        <MobileCategoryBar />
      </header>

      <MobileMenu
        id="mobile-menu"
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        currentPath={pathname}
      />
    </>
  );
}
