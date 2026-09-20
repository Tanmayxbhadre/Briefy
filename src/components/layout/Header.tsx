'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Menu, X, Sparkles, ChevronDown } from 'lucide-react';
import MobileMenu from './MobileMenu';
import MobileCategoryBar from './MobileCategoryBar';
import BrandLogo from '@/components/shared/BrandLogo';
import { HEADER_NAV_LINKS } from '@/lib/categories';
import styles from './Header.module.css';

const PRIMARY_NAV_LINKS = HEADER_NAV_LINKS.slice(0, 7);
const MORE_NAV_LINKS = HEADER_NAV_LINKS.slice(7);

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcut '/' to search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName) &&
        !((e.target as HTMLElement)?.isContentEditable)
      ) {
        e.preventDefault();
        router.push('/search');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // Click outside and Escape to close More dropdown
  useEffect(() => {
    if (!moreOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [moreOpen]);

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

  // Close menus on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
    setMoreOpen(false);
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const isMoreActive = MORE_NAV_LINKS.some((l) => isActive(l.href));

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
              <span className={styles.mastheadTrustBadgeTooltip} role="tooltip">
                Verified newsroom with AI-assisted research &amp; editorial oversight. Click to read our policy.
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className={styles.nav} aria-label="Primary navigation">
            {PRIMARY_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${isActive(link.href) ? styles.navLinkActive : ''}`}
                aria-current={isActive(link.href) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}

            {/* Overflow "More" Dropdown */}
            <div className={styles.moreWrapper} ref={moreRef}>
              <button
                type="button"
                className={`${styles.moreTrigger} ${isMoreActive || moreOpen ? styles.moreTriggerActive : ''}`}
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                aria-haspopup="true"
                aria-label="More categories"
              >
                <span>More</span>
                <ChevronDown size={14} aria-hidden="true" />
              </button>

              {moreOpen && (
                <div className={styles.moreDropdown} role="menu">
                  {MORE_NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      className={`${styles.dropdownItem} ${isActive(link.href) ? styles.dropdownItemActive : ''}`}
                      onClick={() => setMoreOpen(false)}
                      aria-current={isActive(link.href) ? 'page' : undefined}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Right actions */}
          <div className={styles.actions}>
            <Link
              href="/search"
              className={`${styles.iconBtn} ${pathname === '/search' ? styles.iconBtnActive : ''}`}
              aria-label="Search news archive (Press /)"
              title="Search news archive (Press /)"
            >
              <Search size={18} strokeWidth={1.75} />
              <kbd className={styles.searchKbd} aria-hidden="true">/</kbd>
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
