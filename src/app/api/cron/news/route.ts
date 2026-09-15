import { NextResponse } from 'next/server';
import { runAutomaticNewsUpdate } from '@/lib/news/jobRunner';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  return handleCronRequest(request);
}

export async function POST(request: Request) {
  return handleCronRequest(request);
}

async function handleCronRequest(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  const customHeader = request.headers.get('x-cron-secret');
  if (authHeader !== `Bearer ${cronSecret}` && customHeader !== cronSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runAutomaticNewsUpdate({ trigger: 'cron' });
    const status = result.skipped ? 200 : result.success ? 200 : 500;
    return NextResponse.json(result, { status });
  } catch (error) {
    console.error('[NEWS-CRON] Pipeline failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: 'News update failed' }, { status: 500 });
  }
}
