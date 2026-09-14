import { prisma } from '@/lib/db';
import { auditArticleSeo } from './audit';
import type { ArticleForAudit } from './audit';
import { optimizeArticleSeo } from './optimizer';
import { researchArticleKeywords } from './keywordResearch';

export async function optimizeAndPersistArticleSeo(
  articleId: string,
  article: ArticleForAudit & { categorySlug?: string | null }
) {
  const optimized = optimizeArticleSeo(article);
  const keywords = researchArticleKeywords({
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    categorySlug: article.categorySlug,
  });
  const audit = optimized.auditResult;

  await prisma.articleSEO.upsert({
    where: { articleId },
    create: {
      articleId,
      primaryKeyword: keywords.primaryKeyword,
      secondaryKeywords: JSON.stringify(keywords.secondaryKeywords),
      longTailKeywords: JSON.stringify(keywords.longTailKeywords),
      searchIntent: keywords.searchIntent,
      seoTitle: optimized.seoTitle,
      metaDescription: optimized.metaDescription,
      canonicalUrl: optimized.canonicalUrl,
      seoScore: audit.score,
      technicalScore: audit.checks
        .filter((check) => ['title_length', 'meta_desc_length', 'slug_clean'].includes(check.id))
        .reduce((score, check) => score + check.score, 0),
      contentRelevanceScore: audit.checks
        .filter((check) => ['content_depth', 'structured_modules'].includes(check.id))
        .reduce((score, check) => score + check.score, 0),
      qualityScore: audit.checks
        .filter((check) => ['source_attribution'].includes(check.id))
        .reduce((score, check) => score + check.score, 0),
      discoverabilityScore: audit.checks
        .filter((check) => ['image_seo'].includes(check.id))
        .reduce((score, check) => score + check.score, 0),
      imageAltText: optimized.imageAlt,
      optimizationStatus: audit.criticalCount === 0 ? 'OPTIMIZED' : 'NEEDS_REVIEW',
      lastOptimizedAt: new Date(),
    },
    update: {
      primaryKeyword: keywords.primaryKeyword,
      secondaryKeywords: JSON.stringify(keywords.secondaryKeywords),
      longTailKeywords: JSON.stringify(keywords.longTailKeywords),
      searchIntent: keywords.searchIntent,
      seoTitle: optimized.seoTitle,
      metaDescription: optimized.metaDescription,
      canonicalUrl: optimized.canonicalUrl,
      seoScore: audit.score,
      imageAltText: optimized.imageAlt,
      optimizationStatus: audit.criticalCount === 0 ? 'OPTIMIZED' : 'NEEDS_REVIEW',
      lastOptimizedAt: new Date(),
    },
  });

  return { ...optimized, keywords };
}

export function getArticleSeoAudit(article: ArticleForAudit) {
  return auditArticleSeo(article);
}
