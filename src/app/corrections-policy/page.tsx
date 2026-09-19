import type { Metadata } from 'next';
import StaticPage from '@/components/pages/StaticPage';
import { SITE_NAME, siteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Corrections Policy | Briefy.live',
  description:
    'Our transparent standards for handling factual corrections, retractions, and update disclosures across all Briefy.live reporting.',
  alternates: { canonical: siteUrl('/corrections-policy') },
};

export default function CorrectionsPolicyPage() {
  return (
    <StaticPage title="Corrections & Clarifications Policy" updated="September 19, 2026">
      <h2>Commitment to Accuracy</h2>
      <p>
        {SITE_NAME} is committed to reporting news factually, impartially, and with rigorous precision.
        When factual inaccuracies or significant omissions occur, we correct them swiftly and transparently.
      </p>

      <h2>How We Handle Corrections</h2>
      <p>
        If an article contains a factual error of significance (e.g., misstated data, incorrect names,
        dates, or misattributed statements):
      </p>
      <ul>
        <li>The error in the body text is corrected immediately.</li>
        <li>
          A clearly visible correction notice is appended to the bottom of the article noting the
          date, time, and precise description of what was corrected.
        </li>
        <li>
          For typographical or spelling errors that do not alter the factual meaning, we correct the text
          directly without an editorial footnote.
        </li>
      </ul>

      <h2>Retractions & Significant Updates</h2>
      <p>
        In rare circumstances where an entire story is found to be based on fabricated or discredited source material,
        we do not quietly delete the URL. We publish a formal retraction note at the original URL explaining the
        findings and retracting the article.
      </p>

      <h2>Submitting a Correction Request</h2>
      <p>
        Readers, subjects of reporting, and organizations are encouraged to notify our editorial desk of any errors.
        Please include the article URL, specific sentence, and supporting documentation or primary source references:
      </p>
      <p>
        <strong>Corrections Desk:</strong>{' '}
        <a href="mailto:corrections@briefy.live">corrections@briefy.live</a>
      </p>
    </StaticPage>
  );
}
