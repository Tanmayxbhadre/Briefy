import type { Metadata } from 'next';
import Link from 'next/link';
import StaticPage from '@/components/pages/StaticPage';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About Briefy.live',
  description:
    'Briefy.live is an independent digital newsroom delivering clear, concise, verified news across India, World, Technology, AI, Business, and Science.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <StaticPage title={`About ${SITE_NAME}`} updated="September 14, 2026">
      <h2>Our mission</h2>
      <p>
        {SITE_NAME} is an independent digital newsroom built for readers who
        want the facts without the noise. We cover India, World, Technology,
        AI, Business, and Science with a simple standard: every story answers
        what happened, why it matters, and what happens next.
      </p>

      <h2>How we work</h2>
      <p>
        Our editorial pipeline monitors primary sources — government agencies,
        company announcements, regulatory filings, and established wire
        services — around the clock. Stories that are cross-verified across
        multiple independent sources are prioritized; every published article
        carries clear attribution to its underlying sources.
      </p>
      <p>
        Where artificial intelligence assists in drafting or summarizing,
        every story passes an editorial review against source material before
        publication, and we link directly to the original reporting so you
        can verify claims yourself.
      </p>

      <h2>Our standards</h2>
      <ul>
        <li>Clear source attribution on every story</li>
        <li>Corrections issued promptly and transparently</li>
        <li>No pay-for-coverage, no undisclosed sponsored content</li>
        <li>AI assistance is always disclosed and human-reviewed</li>
      </ul>

      <h2>Contact</h2>
      <p>
        Story tips, corrections, and feedback: <a href="mailto:desk@briefy.live">desk@briefy.live</a>
      </p>
      <p>
        Read our <Link href="/editorial-policy">Editorial Policy</Link> for the
        full standards behind our reporting.
      </p>
    </StaticPage>
  );
}
