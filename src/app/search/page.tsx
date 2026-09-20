import type { Metadata } from 'next';
import SearchClient from './SearchClient';
import { siteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: { absolute: 'Search | Briefy.live' },
  description: 'Search all Briefy.live articles.',
  robots: { index: false, follow: true },
  alternates: { canonical: siteUrl('/search') },
};

export default function SearchPage() {
  return <SearchClient />;
}
