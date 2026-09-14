import type { Metadata } from 'next';
import StaticPage from '@/components/pages/StaticPage';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Briefy.live collects, uses, and protects information when you visit our site.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <StaticPage title="Privacy Policy" updated="September 14, 2026">
      <h2>What we collect</h2>
      <p>
        {SITE_NAME} is designed to work without accounts. We do not require
        sign-up to read articles. When you visit, our servers process
        standard technical logs (IP address, browser type, pages requested)
        for security and performance monitoring.
      </p>
      <p>
        Aggregate, non-identifying read analytics (article views, approximate
        read time) are collected to understand which stories matter to
        readers. These records are not used to build individual profiles.
      </p>

      <h2>Cookies</h2>
      <p>
        We use only the cookies required for the site to function
        (for example, an administrative session cookie for editorial staff).
        We do not run third-party advertising or cross-site tracking cookies.
      </p>

      <h2>Newsletter</h2>
      <p>
        If you subscribe to the newsletter, we store your email address for
        the sole purpose of sending it. Every edition includes a one-click
        unsubscribe link, and you can request deletion at any time via{' '}
        <a href="mailto:hello@briefy.live">hello@briefy.live</a>.
      </p>

      <h2>Data retention &amp; your rights</h2>
      <p>
        Server logs are retained for a limited period for security purposes.
        For data access or deletion requests, contact{' '}
        <a href="mailto:hello@briefy.live">hello@briefy.live</a>.
      </p>

      <h2>External links</h2>
      <p>
        Articles link to external sources for verification. We are not
        responsible for the privacy practices of those sites.
      </p>
    </StaticPage>
  );
}
