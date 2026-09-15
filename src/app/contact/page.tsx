import type { Metadata } from 'next';
import StaticPage from '@/components/pages/StaticPage';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Reach the Briefy.live newsroom: story tips, corrections, advertising, and general enquiries.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <StaticPage title="Contact" updated="September 14, 2026">
      <h2>Newsroom</h2>
      <address>
        Story tips &amp; newsdesk: <a href="mailto:desk@briefy.live">desk@briefy.live</a>
        <br />
        Corrections: <a href="mailto:corrections@briefy.live">corrections@briefy.live</a>
      </address>

      <h2>General enquiries</h2>
      <p>
        For everything else — partnerships, advertising, or feedback — email{' '}
        <a href="mailto:hello@briefy.live">hello@briefy.live</a>.
      </p>

      <h2>Response times</h2>
      <p>
        We read every message. Time-sensitive tips and correction requests
        are prioritized; expect a reply within two business days for general
        enquiries.
      </p>
    </StaticPage>
  );
}
