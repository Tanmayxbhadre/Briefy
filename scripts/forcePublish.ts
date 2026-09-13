import { runCleanupWorker } from '../src/lib/ai/cleanupWorker';
import { clusterUnassignedNewsItems } from '../src/lib/news/clustering';
import { runArticleGenerationWorker } from '../src/lib/ai/articleGenerationWorker';
import { runAutoPublishWorker } from '../src/lib/ai/autoPublishWorker';

async function main() {
  console.log('--- FORCED AUTOMATIC PIPELINE ---');

  console.log('1. Cleaning up news older than 2 days permanently...');
  const cleanupRes = await runCleanupWorker();
  console.log('Cleanup Result:', cleanupRes);

  console.log('\n2. Clustering unassigned news items...');
  const clusterRes = await clusterUnassignedNewsItems();
  console.log('Clustering Result:', clusterRes);

  console.log('\n3. Analyzing everything in clusters (generating drafts)...');
  // We'll run the generation worker a few times to ensure we process as much as we can.
  // The worker has internal limits per run (e.g. 5 multi-source, 15 single-source).
  let draftsCreated = 0;
  for (let i = 0; i < 3; i++) {
    console.log(`Generation Pass ${i+1}...`);
    const genRes = await runArticleGenerationWorker();
    console.log(`Pass ${i+1} Result:`, genRes);
    draftsCreated += genRes.draftsCreated;
    if (genRes.processed === 0) break;
  }
  
  console.log('\n4. Force auto-publishing all approved/generated drafts...');
  // We set the thresholds to 0 in .env, so this should sweep everything.
  let publishedCount = 0;
  for (let i = 0; i < 3; i++) {
    console.log(`Publish Pass ${i+1}...`);
    const pubRes = await runAutoPublishWorker(50);
    console.log(`Publish Pass ${i+1} Result:`, pubRes);
    publishedCount += pubRes.published;
    if (pubRes.swept === 0) break;
  }

  console.log('\n--- PIPELINE COMPLETE ---');
  console.log(`Total Drafts Created: ${draftsCreated}`);
  console.log(`Total Drafts Published: ${publishedCount}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
