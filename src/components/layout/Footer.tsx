'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowUp,
  Rss,
  Newspaper,
  ShieldCheck,
  Search,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { FOOTER_TOPICS_PRIMARY, FOOTER_TOPICS_SECONDARY } from '@/lib/categories';
import styles from './Footer.module.css';
import BrandLogo from '@/components/shared/BrandLogo';

const CATEGORIES_PRIMARY = FOOTER_TOPICS_PRIMARY;
const CATEGORIES_SECONDARY = FOOTER_TOPICS_SECONDARY;

const EDITORIAL_LINKS = [
  { label: 'About Briefy', href: '/about' },
  { label: 'Editorial Policy', href: '/editorial-policy' },
  { label: 'Corrections Policy', href: '/corrections-policy' },
  { label: 'Masthead & Team', href: '/masthead' },
  { label: 'Daily Briefing', href: '/daily-news' },
  { label: 'Contact & Newsroom', href: '/contact' },
];

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Editorial Guidelines', href: '/editorial-policy' },
  { label: 'Sitemap Index', href: '/sitemap.xml' },
  { label: 'Google News Feed', href: '/sitemap-news.xml' },
];

const SOCIAL_LINKS = [
  { label: 'X (Twitter)', href: 'https://twitter.com/briefylive', isExternal: true },
  { label: 'Instagram', href: 'https://instagram.com/briefylive', isExternal: true },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/briefylive', isExternal: true },
  { label: 'RSS 2.0 Feed', href: '/rss.xml', isExternal: false, icon: Rss },
];

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className={styles.footer} role="contentinfo" aria-label="Site Footer">
      <div className={`container ${styles.container}`}>
        
        {/* Top Feature Bar / Live Newsroom Banner */}
        <div className={styles.topBar}>
          <div className={styles.topBarContent}>
            <div className={styles.liveStatusBadge}>
              <span className={styles.livePulseDot} aria-hidden="true" />
              <span className={styles.liveStatusText}>Continuous News Stream</span>
            </div>
            <p className={styles.topBarHeadline}>
              Multi-source synthesis &amp; verified real-time journalism updated every 15 minutes.
            </p>
          </div>

          <div className={styles.topBarActions}>
            <Link href="/daily-news" className={styles.briefActionBtn}>
              <Newspaper size={15} aria-hidden="true" />
              <span>Read Today&apos;s Brief</span>
            </Link>
            <button
              onClick={scrollToTop}
              className={styles.backToTopBtn}
              aria-label="Scroll back to top of page"
              type="button"
            >
              <span>Back to top</span>
              <ArrowUp size={15} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Main Footer Directory Grid */}
        <div className={styles.grid}>
          
          {/* Brand & Editorial Mission Column */}
          <div className={styles.brandCol}>
            <div className={styles.brandHeader}>
              <BrandLogo className={styles.logo} />
              <span className={styles.brandBadge}>Newsroom 2.0</span>
            </div>
            <p className={styles.brandBio}>
              Briefy is an independent, real-time news intelligence publication delivering verified reporting, multi-source context, and essential analysis without clutter or sensationalism.
            </p>

            <div className={styles.trustBadges}>
              <div className={styles.trustItem}>
                <ShieldCheck size={16} className={styles.trustIcon} aria-hidden="true" />
                <span>Multi-Source Reporting</span>
              </div>
              <div className={styles.trustItem}>
                <Sparkles size={16} className={styles.trustIcon} aria-hidden="true" />
                <span>AI-Assisted Editorial Oversight</span>
              </div>
            </div>

            <div className={styles.quickSearchLink}>
              <Link href="/search" className={styles.searchPrompt}>
                <Search size={14} aria-hidden="true" />
                <span>Search full news archive...</span>
              </Link>
            </div>
          </div>

          <nav className={styles.directoryNav} aria-label="Footer directory" style={{ display: 'contents' }}>
            {/* Section 1: Topics (Part 1) */}
            <div className={styles.navCol}>
              <h3 className={styles.colTitle}>News Topics</h3>
              <ul className={styles.linkList}>
                {CATEGORIES_PRIMARY.map((cat) => (
                  <li key={cat.href}>
                    <Link href={cat.href} className={styles.navLink}>
                      {cat.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Section 2: Topics (Part 2) */}
            <div className={styles.navCol}>
              <h3 className={styles.colTitle}>Coverage</h3>
              <ul className={styles.linkList}>
                {CATEGORIES_SECONDARY.map((cat) => (
                  <li key={cat.href}>
                    <Link href={cat.href} className={styles.navLink}>
                      {cat.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Section 3: Editorial & Company */}
            <div className={styles.navCol}>
              <h3 className={styles.colTitle}>Editorial</h3>
              <ul className={styles.linkList}>
                {EDITORIAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={styles.navLink}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Section 4: Feeds & Connect */}
            <div className={styles.navCol}>
              <h3 className={styles.colTitle}>Connect &amp; Feeds</h3>
              <ul className={styles.linkList}>
                {SOCIAL_LINKS.map((social) => {
                  const IconComponent = social.icon;
                  if (social.isExternal) {
                    return (
                      <li key={social.label}>
                        <a
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.navLink}
                        >
                          <span>{social.label}</span>
                          <ExternalLink size={12} className={styles.extIcon} aria-hidden="true" />
                        </a>
                      </li>
                    );
                  }
                  return (
                    <li key={social.label}>
                      <Link href={social.href} className={styles.navLink}>
                        {IconComponent && <IconComponent size={13} aria-hidden="true" />}
                        <span>{social.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>

        </div>

        {/* Legal and Disclaimer Bar */}
        <div className={styles.legalSection}>
          <div className={styles.legalLinks}>
            {LEGAL_LINKS.map((item) => (
              <Link key={item.label} href={item.href} className={styles.legalLink}>
                {item.label}
              </Link>
            ))}
          </div>
          <p className={styles.disclaimerText}>
            Briefy operates an automated editorial intelligence platform that monitors and synthesizes news from global sources. Content is generated for informational purposes. All rights and trademarks belong to their respective copyright holders.
          </p>
        </div>

        {/* Bottom Bar: Copyright and Metadata */}
        <div className={styles.bottomBar}>
          <div className={styles.copyrightNotice}>
            © {currentYear} <span className={styles.brandHighlight}>Briefy.live</span>. All rights reserved.
          </div>
          <div className={styles.techInfo}>
            <span>Global Edition</span>
            <span className={styles.divider} aria-hidden="true">·</span>
            <span>Real-time RSS 2.0</span>
            <span className={styles.divider} aria-hidden="true">·</span>
            <span>Fast &amp; Privacy First</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
