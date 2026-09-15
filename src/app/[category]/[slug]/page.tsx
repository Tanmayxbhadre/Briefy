import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublishedArticleBySlug, getRelatedArticles } from '@/lib/articles';
import ArticleHeader from '@/components/article/ArticleHeader';
import ArticleBody from '@/components/article/ArticleBody';
import QuickSummary from '@/components/article/QuickSummary';
import WhatYouNeedToKnow from '@/components/article/WhatYouNeedToKnow';
import Timeline from '@/components/article/Timeline';
import RelatedStories from '@/components/article/RelatedStories';
import MultiSourceAttribution from '@/components/article/MultiSourceAttribution';
import AdSlot from '@/components/shared/AdSlot';
import SchemaOrg from '@/components/seo/SchemaOrg';
import SocialShare from '@/components/article/SocialShare';
import ReadingProgressBar from '@/components/article/ReadingProgressBar';
import { SITE_URL } from '@/lib/site';
import { articleMetadata } from '@/lib/seo/metadata';

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

  return articleMetadata(article);
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
        </div>

        {/* Body Content */}
        <ArticleBody article={article} />

        {/* Context panel follows the complete article body. */}
        {article.whatYouNeedToKnow && (
          <div className="article-container">
            <WhatYouNeedToKnow data={article.whatYouNeedToKnow} />
          </div>
        )}

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

        {/* Related content stays inside the article flow, before references. */}
        <div className="container" style={{ paddingBottom: '2rem' }}>
          <RelatedStories articles={relatedArticles} />
        </div>

        {/* Sources are intentionally the final article section. */}
        <div className="article-container">
          <MultiSourceAttribution sources={article.sources} />
        </div>
      </article>
    </>
  );
}
