import Link from 'next/link';
import styles from './StaticPage.module.css';

interface StaticPageProps {
  title: string;
  updated: string;
  children: React.ReactNode;
}

/**
 * Shared shell for trust / E-E-A-T pages (About, Editorial Policy, Contact,
 * Privacy, Terms). Consistent editorial typography, max-width for readability.
 */
export default function StaticPage({ title, updated, children }: StaticPageProps) {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.updated}>Last updated: {updated}</p>
        <div className={styles.prose}>{children}</div>
        <p className={styles.backLink}>
          <Link href="/">← Back to homepage</Link>
        </p>
      </div>
    </div>
  );
}
