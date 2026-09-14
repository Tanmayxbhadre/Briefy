import type { Metadata } from 'next';
import StaticPage from '@/components/pages/StaticPage';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Editorial Policy',
  description:
    'The editorial standards, sourcing rules, AI-use disclosure, and corrections policy behind every story published on Briefy.live.',
  alternates: { canonical: '/editorial-policy' },
};

export default function EditorialPolicyPage() {
  return (
    <StaticPage title="Editorial Policy" updated="September 14, 2026">
      <h2>Sourcing &amp; attribution</h2>
      <p>
        Every published story attributes its underlying sources — agency
        reports, official statements, filings, or primary documents — with
        direct links wherever possible. Stories synthesized from multiple
        sources display all of them, so readers can judge coverage breadth
        themselves.
      </p>

      <h2>Artificial intelligence disclosure</h2>
      <p>
        {SITE_NAME} uses AI tools to accelerate research, drafting, and
        summarization. Every AI-assisted article is reviewed against its
        source material before publication. We never auto-publish
        AI-generated content without verification against corroborating
        sources, and automated drafts that fail verification are held from
        publication.
      </p>

      <h2>Accuracy &amp; corrections</h2>
      <p>
        Factual errors are corrected promptly. Substantive corrections are
        noted on the article with the date of the update; the original error
        is preserved in the record. To request a correction, email{' '}
        <a href="mailto:desk@briefy.live">desk@briefy.live</a> with the story
        URL and the specific issue.
      </p>

      <h2>Independence</h2>
      <p>
        We do not accept payment for coverage. Commercial considerations
        never influence editorial judgments, and any future commercial
        partnerships will be clearly labelled.
      </p>

      <h2>Unnamed sources</h2>
      <p>
        We publish unnamed-source material only when the information is
        clearly in the public interest and the source faces genuine risk from
        identification — and only with editorial approval.
      </p>
    </StaticPage>
  );
}
