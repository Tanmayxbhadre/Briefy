import { prisma } from '@/lib/db';
import { getArticleSeoAudit, optimizeAndPersistArticleSeo } from './articleSeoService';
import type { ArticleForAudit } from './audit';

export type SeoValidation = {
  version: number;
  score: number;
  errors: string[];
  warnings: string[];
  checkedAt: string;
};

function toValidation(audit: ReturnType<typeof getArticleSeoAudit>, version: number): SeoValidation {
  return {
    version,
    score: audit.score,
    errors: audit.checks.filter((check) => check.status === 'critical').map((check) => check.message),
    warnings: audit.checks.filter((check) => check.status === 'warning').map((check) => check.message),
    checkedAt: new Date().toISOString(),
  };
}

export function validateSEO(article: ArticleForAudit, version: number): SeoValidation {
  return toValidation(getArticleSeoAudit(article), version);
}

export async function enhanceArticleSEO(id: string) {
  const claimed = await prisma.articleDraft.updateMany({
    where: { id, status: { not: 'PUBLISHED' }, seoWorkflowStatus: { in: ['PENDING', 'SEO_FAILED', 'SEO_REVIEW'] } },
    data: { seoWorkflowStatus: 'PROCESSING', seoProcessingAt: new Date(), seoLastError: null },
  });
  if (claimed.count !== 1) throw new Error('SEO enhancement is already processing or the article is not editable');

  try {
    const draft = await prisma.articleDraft.findUnique({ where: { id }, include: { category: true } });
    if (!draft) throw new Error('Article not found');
    const article: ArticleForAudit & { categorySlug?: string | null } = {
      title: draft.title, slug: draft.slug, excerpt: draft.excerpt, content: draft.content,
      seoTitle: draft.seoTitle, metaDescription: draft.metaDescription, categorySlug: draft.category?.slug,
      authorName: draft.authorName, featuredImage: draft.featuredImage, imageAlt: draft.imageAlt,
      sources: draft.sources, quickSummary: draft.quickSummary, whatYouNeedToKnow: draft.whatYouNeedToKnow, tags: draft.tags,
    };
    const optimized = await optimizeAndPersistArticleSeo(id, article);
    const validation = validateSEO({ ...article, seoTitle: optimized.seoTitle, metaDescription: optimized.metaDescription, imageAlt: optimized.imageAlt }, draft.contentVersion);
    const nextStatus = validation.errors.length === 0 ? 'READY_TO_PUBLISH' : 'SEO_REVIEW';
    await prisma.$transaction([
      prisma.articleDraft.update({ where: { id }, data: { seoWorkflowStatus: nextStatus, seoVersion: draft.contentVersion, seoValidatedVersion: validation.errors.length === 0 ? draft.contentVersion : null, seoValidation: JSON.stringify(validation), seoProcessingAt: null } }),
      prisma.articleSEO.update({ where: { articleId: id }, data: { contentVersion: draft.contentVersion, validatedVersion: validation.errors.length === 0 ? draft.contentVersion : null, validationPayload: JSON.stringify(validation), processingAt: null, lastError: null } }),
    ]);
    return validation;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SEO enhancement failed';
    await prisma.articleDraft.update({ where: { id }, data: { seoWorkflowStatus: 'SEO_FAILED', seoProcessingAt: null, seoLastError: message, seoRetryCount: { increment: 1 } } });
    throw error;
  }
}

export async function assertPublishableArticle(id: string) {
  const draft = await prisma.articleDraft.findUnique({ where: { id }, include: { seoProfile: true } });
  if (!draft) throw new Error('Article not found');
  if (draft.seoWorkflowStatus !== 'READY_TO_PUBLISH' || draft.seoValidatedVersion !== draft.contentVersion || draft.seoVersion !== draft.contentVersion) {
    throw new Error('Current SEO validation is required before publishing');
  }
  const validation = draft.seoValidation ? JSON.parse(draft.seoValidation) as SeoValidation : null;
  if (!validation || validation.errors.length > 0) throw new Error('SEO validation has blocking errors');
  return draft;
}
