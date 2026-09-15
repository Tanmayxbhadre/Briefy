import type { Metadata } from 'next';
import type { Article, Category } from '@/lib/types';
import { brandedTitle, SITE_NAME, SITE_URL, siteUrl } from '@/lib/site';

export function articleMetadata(article: Article): Metadata {
  const canonical = article.canonicalUrl?.startsWith('http')
    ? article.canonicalUrl
    : siteUrl(`/${article.category.slug}/${article.slug}`);
  const title = brandedTitle(article.seoTitle || article.title);
  const description = article.metaDescription || article.description;

  return {
    title: { absolute: title },
    description,
    authors: [{ name: article.author.name }],
    alternates: { canonical },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      url: canonical,
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt || article.publishedAt,
      authors: [article.author.name],
      section: article.category.name,
      tags: article.tags,
      images: [{ url: article.featuredImage, width: 1200, height: 675, alt: article.imageAlt }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [article.featuredImage] },
  };
}

export function categoryMetadata(category: Category, hasArticles = true): Metadata {
  const title = brandedTitle(category.seoTitle || `${category.name} News`);
  const description = category.seoDescription || category.description;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: siteUrl(`/${category.slug}`) },
    robots: hasArticles ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title, description, siteName: SITE_NAME, url: siteUrl(`/${category.slug}`), type: 'website' },
  };
}

export const homeMetadata: Metadata = {
  title: { absolute: `${SITE_NAME} | Serious Journalism for the Modern Reader` },
  alternates: { canonical: SITE_URL, types: { 'application/rss+xml': siteUrl('/rss.xml') } },
};
