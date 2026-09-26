import { runAutomaticNewsUpdate } from '../src/lib/news/jobRunner';
import { prisma } from '../src/lib/db';

async function main() {
  console.log('==================================================');
  console.log('Briefy.live AUTOMATED NEWS PIPELINE (EXTERNAL)');
  console.log('Timestamp:', new Date().toISOString());
  console.log('==================================================\n');

  const startTime = Date.now();

  try {
    const result = await runAutomaticNewsUpdate({ trigger: 'cron' });

    if (result.skipped) {
      console.log(`[SKIPPED] ${result.reason || 'Collection job already running'}`);
      process.exit(0);
    }

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n==================================================');
    console.log(`PIPELINE EXECUTION SUMMARY [${result.status}]`);
    console.log('==================================================');
    console.log(`Sources Processed: ${result.sourcesProcessed}`);
    console.log(`Items Found:       ${result.itemsFound}`);
    console.log(`New Items:         ${result.newItems}`);
    console.log(`Duplicates:        ${result.duplicates}`);
    console.log(`Duration:          ${durationSec}s`);

    if ('downstream' in result && result.downstream) {
      const { clustering, aiGeneration, autoPublish, errors } = result.downstream;
      console.log('--------------------------------------------------');
      console.log(`Clusters Created:  ${clustering?.clustersCreated ?? 0}`);
      console.log(`Drafts Created:    ${aiGeneration?.draftsCreated ?? 0}`);
      console.log(`Auto-Published:    ${(aiGeneration?.autoPublishedCount ?? 0) + (autoPublish?.published ?? 0)}`);
      if (errors && errors.length > 0) {
        console.log(`Downstream Errors: ${errors.join('; ')}`);
      }
    }
    console.log('==================================================');

    // Optional webhook ping to trigger Vercel revalidation if SITE_URL is provided
    const siteUrl = process.env.SITE_URL || 'https://www.briefy.live';
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && siteUrl) {
      try {
        console.log(`[REVALIDATE-PING] Triggering publish sweep on ${siteUrl}...`);
        const response = await fetch(`${siteUrl}/api/cron/publish`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cronSecret}`,
            'Content-Type': 'application/json',
          },
        });
        console.log(`[REVALIDATE-PING] Response status: ${response.status}`);
      } catch (pingErr) {
        console.warn('[REVALIDATE-PING] Failed to ping revalidate endpoint:', pingErr instanceof Error ? pingErr.message : pingErr);
      }
    }

    process.exit(result.success ? 0 : 0); // Do not fail workflow on partial skips/non-fatal errors
  } catch (error) {
    console.error('Fatal pipeline error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
