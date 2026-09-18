import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { DM_Serif_Display, Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SchemaOrg from '@/components/seo/SchemaOrg';
import GlobalLiveNewsListener from '@/components/layout/GlobalLiveNewsListener';
import { SITE_URL, SITE_NAME } from '@/lib/site';

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-serif',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

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
    default: 'Briefy.live | Serious Journalism for the Modern Reader',
    template: '%s | Briefy.live',
  },
  description:
    'Briefy.live delivers clear, concise, and trustworthy news across India, World, Technology, AI, Business, and Science.',
  keywords: ['India news', 'world news', 'technology news', 'AI news', 'business news', 'science news'],
  applicationName: SITE_NAME,
  category: 'news',
  authors: [{ name: 'Briefy.live Editorial Team' }],
  creator: 'Briefy.live',
  publisher: 'Briefy.live',
  // Search Console / Bing Webmaster verification (set env vars when available)
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION
      ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png', sizes: '512x512' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.webmanifest',
  // RSS/Atom autodiscovery — feeds were previously invisible to readers
  // and aggregators.
  alternates: {
    canonical: SITE_URL,
    types: {
      'application/rss+xml': `${SITE_URL}/rss.xml`,
    },
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
    siteName: SITE_NAME,
    title: 'Briefy.live | Serious Journalism for the Modern Reader',
    description:
      'Clear, concise news across India, World, Technology, AI, Business, and Science.',
    images: [
      {
        url: '/briefy-logo.png',
        width: 1200,
        height: 630,
        alt: 'Briefy.live — Serious Journalism for the Modern Reader',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@briefylive',
    creator: '@briefylive',
    title: 'Briefy.live | Serious Journalism for the Modern Reader',
    description:
      'Clear, concise, and trustworthy news across India, World, Technology, AI, Business, and Science.',
    images: [`${SITE_URL}/briefy-logo.png`],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <SchemaOrg />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-0KXVB3MFQ0"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-0KXVB3MFQ0');
          `}
        </Script>
      </head>
      <body className={`${dmSerif.variable} ${inter.variable}`}>
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
