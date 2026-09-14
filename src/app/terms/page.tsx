import type { Metadata } from 'next';
import StaticPage from '@/components/pages/StaticPage';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description:
    'The terms governing use of Briefy.live, including content licensing, acceptable use, and limitation of liability.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <StaticPage title="Terms of Use" updated="September 14, 2026">
      <h2>Acceptance</h2>
      <p>
        By accessing {SITE_NAME} you agree to these terms. If you do not
        agree, please do not use the site.
      </p>

      <h2>Content licensing</h2>
      <p>
        Articles on {SITE_NAME} are protected by copyright. You may share
        links freely and quote brief excerpts with attribution and a link
        back to the original article. Bulk reproduction, scraping, or
        republishing of full articles without written permission is not
        permitted.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Do not attempt to disrupt, overload, or gain unauthorized access to the service.</li>
        <li>Do not use automated systems to access the site in ways that violate our robots.txt or impose unreasonable load.</li>
        <li>Do not misrepresent content origin when sharing our articles.</li>
      </ul>

      <h2>Accuracy &amp; no warranty</h2>
      <p>
        News content is provided for informational purposes. While we follow
        the standards in our Editorial Policy, we provide the service
        &quot;as is&quot; without warranties of any kind. Content is not a
        substitute for professional advice (financial, legal, medical, or
        otherwise).
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, {SITE_NAME} is not liable
        for indirect or consequential damages arising from use of the site,
        nor for content on external sites we link to for attribution.
      </p>

      <h2>Changes</h2>
      <p>
        These terms may be updated; material changes will be reflected in
        the &quot;Last updated&quot; date above.
      </p>
    </StaticPage>
  );
}
