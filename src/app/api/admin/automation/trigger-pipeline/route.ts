import { NextResponse } from 'next/server';
import { runAutomaticNewsUpdate } from '@/lib/news/jobRunner';
import { getAdminSession, recordActivity } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST() {
  try {
    const session = await getAdminSession();
    if (!session.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await runAutomaticNewsUpdate({ trigger: 'manual' });

    const newItems = 'newItems' in result ? result.newItems : 0;
    const draftsCreated = 'downstream' in result ? result.downstream?.aiGeneration?.draftsCreated ?? 0 : 0;
    const published = 'downstream' in result ? result.downstream?.autoPublish?.published ?? 0 : 0;

    await recordActivity(
      'automation_pipeline_triggered',
      'Full News Pipeline',
      `Manual full automation pipeline run completed. Inserted: ${newItems}, Drafts created: ${draftsCreated}, Published: ${published}.`,
      session.user || 'Admin'
    );

    return NextResponse.json({
      success: true,
      result,
      message: 'Automation pipeline completed successfully.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Pipeline trigger failed';
    console.error('[AUTOMATION-TRIGGER] Error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
