import type { Metadata } from 'next';
import SearchClient from './SearchClient';

// The search page previously rendered results entirely client-side with no
// metadata at all (client components cannot export metadata), leaving
// /search?q=... URLs indexable duplicate content. The server wrapper adds a
// noindex while keeping the page crawlable (robots.txt must NOT block it,
// or search engines would never see the noindex).
export const metadata: Metadata = {
  title: 'Search',
  description: 'Search all Briefy.live articles.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/search' },
};

export default function SearchPage() {
  return <SearchClient />;
}
