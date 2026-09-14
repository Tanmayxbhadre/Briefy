import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublishedArticleBySlug, getRelatedArticles } from '@/lib/articles';
import ArticleHeader from '@/components/article/ArticleHeader';
import ArticleBody from '@/components/article/ArticleBody';
import QuickSummary from '@/components/article/QuickSummary';
import WhatYouNeedToKnow from '@/components/article/WhatYouNeedToKnow';
import Timeline from '@/components/article/Timeline';
import RelatedStories from '@/components/article/RelatedStories';
import AdSlot from '@/components/shared/AdSlot';
import SchemaOrg from '@/components/seo/SchemaOrg';
import SocialShare from '@/components/article/SocialShare';
import ReadingProgressBar from '@/components/article/ReadingProgressBar';
import { SITE_URL } from '@/lib/site';

// ISR: edge-cached and revalidated on publish via revalidateNewsPublication().
// Previously force-dynamic: every crawler hit re-ran the full DB pipeline.
export const revalidate = 300;
export const dynamicParams = true;

interface Props {
  params: Promise<{ category: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) return {};

  const url = article.canonicalUrl || `${SITE_URL}/${article.category.slug}/${article.slug}`;

  // Prefer the SEO-optimizer output (seoTitle/metaDescription) when present;
  // the AI pipeline's SEO work previously never reached crawlers.
  const title = article.seoTitle || article.title;
  const description = article.metaDescription || article.description;

  return {
    title,
    description,
    authors: [{ name: article.author.name }],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author.name],
      section: article.category.name,
      tags: article.tags,
      images: [
        {
          url: article.featuredImage,
          width: 1200,
          height: 675,
          alt: article.imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [article.featuredImage],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { category, slug } = await params;
  const article = await getPublishedArticleBySlug(slug);

  if (!article || article.category.slug !== category) notFound();

  // DB-backed: previously this only ever returned mock articles.
  const relatedArticles = await getRelatedArticles(article, 4);

  return (
    <>
      <ReadingProgressBar />
      <SchemaOrg article={article} pageType="article" />

      <article>
        {/* Article Header */}
        <ArticleHeader article={article} />

        <div className="article-container">
          <SocialShare
            title={article.title}
            url={`${SITE_URL}/${article.category.slug}/${article.slug}`}
          />
        </div>

        {/* Ad slot below header */}
        <div className="article-container" style={{ paddingBottom: '2rem' }}>
          <AdSlot id="ad-article-top" width={728} height={90} />
        </div>

        {/* Article Body */}
        <div className="article-container">
          {/* Quick Summary */}
          {article.quickSummary && article.quickSummary.length > 0 && (
            <QuickSummary points={article.quickSummary} />
          )}

          {/* What You Need To Know */}
          {article.whatYouNeedToKnow && (
            <WhatYouNeedToKnow data={article.whatYouNeedToKnow} />
          )}
        </div>

        {/* Body Content */}
        <ArticleBody article={article} />

        {/* Ad slot between content and related */}
        <div className="article-container" style={{ paddingBottom: '2rem' }}>
          <AdSlot id="ad-article-mid" width={728} height={90} />
        </div>

        {/* Timeline */}
        {article.timeline && article.timeline.length > 0 && (
          <div className="article-container">
            <Timeline events={article.timeline} />
          </div>
        )}
      </article>

      {/* Related Stories */}
      <div className="container" style={{ paddingBottom: '4rem' }}>
        <RelatedStories articles={relatedArticles} />
      </div>
    </>
  );
}
