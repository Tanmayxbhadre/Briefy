import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SchemaOrg from '@/components/seo/SchemaOrg';
import GlobalLiveNewsListener from '@/components/layout/GlobalLiveNewsListener';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://briefy.live';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#fafaf8',
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'BRIEFY — Latest India, World & Technology News',
    template: '%s — BRIEFY',
  },
  description:
    'Get clear, concise, and trustworthy India, world, technology, AI, business, and science news from BRIEFY, your daily digital news briefing.',
  keywords: ['India news', 'world news', 'technology news', 'AI news', 'business news', 'science news'],
  applicationName: 'BRIEFY',
  category: 'news',
  authors: [{ name: 'BRIEFY Editorial Team' }],
  creator: 'BRIEFY',
  publisher: 'BRIEFY',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'BRIEFY',
    title: 'BRIEFY — Latest India, World & Technology News',
    description:
      'Clear, concise news across India, World, Technology, AI, Business, and Science.',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'BRIEFY — Latest India, World and Technology News',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@briefylive',
    creator: '@briefylive',
    title: 'BRIEFY — Latest India, World & Technology News',
    description: 'Clear, concise news across India, World, Technology, AI, Business, and Science.',
    images: [`${SITE_URL}/og-image.png`],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <SchemaOrg />
      </head>
      <body>
        <div className="page-wrapper">
          <Header />
          <main className="main-content" id="main-content">
            {children}
          </main>
          <Footer />
        </div>
        <GlobalLiveNewsListener />
      </body>
    </html>
  );
}
