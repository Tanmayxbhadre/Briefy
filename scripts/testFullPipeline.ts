import { runAutomaticNewsUpdate } from '../src/lib/news/jobRunner';
import { prisma } from '../src/lib/db';

async function testFullPipeline() {
  console.log('==================================================');
  console.log('TESTING FULL AUTOMATIC NEWS PIPELINE');
  console.log('==================================================\n');

  const beforePublished = await prisma.articleDraft.count({ where: { status: 'PUBLISHED' } });
  const beforeDrafts = await prisma.articleDraft.count();
  console.log(`Current published articles: ${beforePublished}`);
  console.log(`Current total drafts: ${beforeDrafts}\n`);

  console.log('Starting runAutomaticNewsUpdate({ trigger: "cli" })...\n');
  const result = await runAutomaticNewsUpdate({ trigger: 'cli' });

  console.log('\n==================================================');
  console.log('PIPELINE RESULT:', result.status);
  console.log('==================================================');
  console.log('Sources processed:', result.sourcesProcessed);
  console.log('New news items:', result.newItems);
  console.log('Duplicates:', result.duplicates);
  console.log('Downstream:', JSON.stringify(result.downstream, null, 2));

  const afterPublished = await prisma.articleDraft.count({ where: { status: 'PUBLISHED' } });
  const afterDrafts = await prisma.articleDraft.count();
  console.log(`\nPublished articles: ${beforePublished} -> ${afterPublished} (+${afterPublished - beforePublished})`);
  console.log(`Total drafts: ${beforeDrafts} -> ${afterDrafts} (+${afterDrafts - beforeDrafts})`);
}

testFullPipeline()
  .catch((err) => console.error('Pipeline error:', err))
  .finally(() => prisma.$disconnect());
