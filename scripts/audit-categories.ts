import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/db';
import { classifyCategory } from '../src/lib/news/classifier';
import { articles as mockArticles } from '../src/lib/mock-data';

interface Discrepancy {
  id: string;
  slug: string;
  currentCategory: string;
  suggestedCategory: string;
  headline: string;
}

async function runCategoryAudit() {
  console.log('[Category Audit] Starting category consistency scan...');
  const discrepancies: Discrepancy[] = [];

  try {
    const publishedDrafts = await prisma.articleDraft.findMany({
      where: { status: 'PUBLISHED' },
      include: { category: true },
    });

    for (const draft of publishedDrafts) {
      const current = draft.category?.slug || 'unknown';
      const suggested = classifyCategory(draft.title, current);

      if (current !== suggested) {
        discrepancies.push({
          id: draft.id,
          slug: draft.slug,
          currentCategory: current,
          suggestedCategory: suggested,
          headline: draft.title,
        });
      }
    }
  } catch (err) {
    console.warn('[Category Audit] DB query warning (using mock data as fallback):', err);
    for (const article of mockArticles) {
      const current = article.category.slug;
      const suggested = classifyCategory(article.title, current);

      if (current !== suggested) {
        discrepancies.push({
          id: article.id,
          slug: article.slug,
          currentCategory: current,
          suggestedCategory: suggested,
          headline: article.title,
        });
      }
    }
  }

  // Output CSV
  const csvRows = [
    'ID,Slug,CurrentCategory,SuggestedCategory,Headline',
    ...discrepancies.map(
      (d) =>
        `"${d.id}","${d.slug}","${d.currentCategory}","${d.suggestedCategory}","${d.headline.replace(/"/g, '""')}"`
    ),
  ];

  const outputPath = path.join(process.cwd(), 'docs', 'category-audit.csv');
  fs.writeFileSync(outputPath, csvRows.join('\n'), 'utf8');

  console.log(
    `[Category Audit] Scan complete! Found ${discrepancies.length} potential discrepancies.`
  );
  console.log(`[Category Audit] Output saved to: ${outputPath}`);
}

runCategoryAudit().catch((err) => {
  console.error('[Category Audit] Fatal error:', err);
  process.exit(1);
});
