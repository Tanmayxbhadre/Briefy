import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search News',
  description: 'Search BRIEFY for the latest India, world, technology, AI, business, and science news.',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: '/search',
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
