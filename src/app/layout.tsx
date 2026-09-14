import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SchemaOrg from '@/components/seo/SchemaOrg';
import GlobalLiveNewsListener from '@/components/layout/GlobalLiveNewsListener';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.briefy.live';

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
    default: 'BRIEFY — India News, World News & Technology Updates',
    template: '%s — BRIEFY',
  },
  description:
    'BRIEFY delivers clear, concise India news, world news, technology updates, AI news, business news, and science coverage in one daily briefing.',
  keywords: ['India news', 'world news', 'technology news', 'AI news', 'business news', 'science news'],
  applicationName: 'BRIEFY',
  category: 'news',
  authors: [{ name: 'BRIEFY Editorial Team' }],
  creator: 'BRIEFY',
  publisher: 'BRIEFY',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
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
    title: 'BRIEFY — India News, World News & Technology Updates',
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
