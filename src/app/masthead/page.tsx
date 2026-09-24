import type { Metadata } from 'next';
import Link from 'next/link';
import StaticPage from '@/components/pages/StaticPage';
import { SITE_NAME, siteUrl } from '@/lib/site';
import { KNOWN_AUTHORS } from '@/config/authors';

export const metadata: Metadata = {
  title: 'Masthead & Editorial Leadership',
  description:
    'Meet the editorial team, newsroom leadership, and technical directors behind Briefy.live news synthesis and verification.',
  alternates: { canonical: siteUrl('/masthead') },
};

export default function MastheadPage() {
  const verifiedAuthors = Object.values(KNOWN_AUTHORS);

  return (
    <StaticPage title="Masthead & Editorial Leadership" updated="September 19, 2026">
      <h2>Editorial Leadership</h2>
      <p>
        {SITE_NAME} operates under strict editorial oversight, combining algorithmic news gathering with human editorial integrity and rigorous sourcing standards.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: '2rem 0' }}>
        {verifiedAuthors.map((author) => (
          <div
            key={author.slug}
            style={{
              padding: '1.25rem',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              backgroundColor: 'var(--color-bg-card)',
            }}
          >
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem' }}>
              <Link href={`/author/${author.slug}`} style={{ color: 'var(--color-text)', textDecoration: 'none' }}>
                {author.name}
              </Link>
            </h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--color-accent)', fontWeight: 600 }}>
              {author.role}
            </p>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>
              {author.bio}
            </p>
            <div style={{ fontSize: '0.85rem' }}>
              <Link href={`/author/${author.slug}`} style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
                View Author Profile & Coverage →
              </Link>
            </div>
          </div>
        ))}

        {/* Editorial Desk Placeholder */}
        <div
          style={{
            padding: '1.25rem',
            border: '1px dashed var(--color-border)',
            borderRadius: '8px',
          }}
        >
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem' }}>Newsroom Desk & Topic Specialists</h3>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--color-accent)', fontWeight: 600 }}>
            General Inquiries & Topic Leads
          </p>
          <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>
            Our newsroom monitors 24/7 global wire feeds, institutional press desks, and regulatory agencies. Additional staff journalists and section leads will be listed as our newsroom expands.
          </p>
        </div>
      </div>

      <h2>Ownership & Publishing Entity</h2>
      <p>
        Briefy.live is an independent digital news publishing platform headquartered in India. We maintain full editorial independence from political entities, commercial sponsors, and external lobbying interests.
      </p>

      <h2>Contacting the Newsroom</h2>
      <p>
        For press releases, inquiries, and news tips:
      </p>
      <ul>
        <li><strong>General News Desk:</strong> <a href="mailto:desk@briefy.live">desk@briefy.live</a></li>
        <li><strong>Corrections:</strong> <a href="mailto:corrections@briefy.live">corrections@briefy.live</a></li>
        <li><strong>Editor-in-Chief:</strong> <a href="mailto:editor@briefy.live">editor@briefy.live</a></li>
      </ul>
    </StaticPage>
  );
}
