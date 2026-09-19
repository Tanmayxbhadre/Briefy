import type { Metadata } from 'next';
import type { Article, Category } from '../types';
import { brandedTitle, SITE_NAME, SITE_URL, siteUrl } from '../site';

export function articleMetadata(article: Article): Metadata {
  const canonical = article.canonicalUrl?.startsWith('http')
    ? article.canonicalUrl
    : siteUrl(`/${article.category.slug}/${article.slug}`);
  const title = brandedTitle(article.seoTitle || article.title);

  // Clean description: derive from metaDescription or lede, removing any legacy boilerplate phrases
  let description = (article.metaDescription || article.description || article.title).trim();
  description = description
    .replace(/^read briefy\.live's comprehensive analysis on\s*/i, '')
    .replace(/\s*facts, timeline, and industry implications explained\.?$/i, '')
    .trim();

  if (description.length > 155) {
    const cut = description.slice(0, 152);
    const lastSpace = cut.lastIndexOf(' ');
    description = (lastSpace > 100 ? cut.slice(0, lastSpace) : cut) + '...';
  }

  const isIndexable = !article.noindex;

  return {
    title: { absolute: title },
    description,
    authors: [{ name: article.author.name }],
    alternates: { canonical },
    robots: isIndexable
      ? { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } }
      : { index: false, follow: true },
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      url: canonical,
      type: 'article',
      locale: 'en_IN',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt || article.publishedAt,
      authors: [article.author.name],
      section: article.category.name,
      tags: article.tags,
      images: [{ url: article.featuredImage || `${SITE_URL}/briefy-logo.png`, width: 1200, height: 630, alt: article.imageAlt || title }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@briefylive',
      title,
      description,
      images: [article.featuredImage || `${SITE_URL}/briefy-logo.png`],
    },
  };
}

export function categoryMetadata(category: Category, hasArticles = true): Metadata {
  const title = category.seoTitle?.includes('|')
    ? category.seoTitle
    : brandedTitle(category.seoTitle || `${category.name} News Today`);
  const description = category.seoDescription || category.description;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: siteUrl(`/${category.slug}`) },
    robots: hasArticles ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      url: siteUrl(`/${category.slug}`),
      type: 'website',
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@briefylive',
      title,
      description,
    },
  };
}

export const homeMetadata: Metadata = {
  title: { absolute: 'Latest India & World News, Tech, AI, Business | Briefy.live' },
  description:
    'Briefy.live delivers clear, verified news and essential analysis across India, World affairs, Technology, AI breakthroughs, Business, and Science.',
  alternates: { canonical: SITE_URL, types: { 'application/rss+xml': siteUrl('/rss.xml') } },
  openGraph: {
    title: 'Latest India & World News, Tech, AI, Business | Briefy.live',
    description:
      'Briefy.live delivers clear, verified news and essential analysis across India, World affairs, Technology, AI breakthroughs, Business, and Science.',
    siteName: SITE_NAME,
    url: SITE_URL,
    type: 'website',
    locale: 'en_IN',
    images: [{ url: `${SITE_URL}/briefy-logo.png`, width: 1200, height: 630, alt: 'Briefy.live News' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@briefylive',
    title: 'Latest India & World News, Tech, AI, Business | Briefy.live',
    description:
      'Briefy.live delivers clear, verified news and essential analysis across India, World affairs, Technology, AI breakthroughs, Business, and Science.',
    images: [`${SITE_URL}/briefy-logo.png`],
  },
};
