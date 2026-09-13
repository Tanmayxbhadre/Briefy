import { NextResponse } from 'next/server';
import { getRotationStatus } from '@/lib/ai/modelRotator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/ai/model-status
 * Returns the current rotation state of all AI models.
 * Shows which models are rate-limited and how long until they recover.
 */
export async function GET() {
  try {
    const status = getRotationStatus();
    const summary = {
      total: status.length,
      available: status.filter((s) => !s.rateLimited).length,
      rateLimited: status.filter((s) => s.rateLimited).length,
    };

    return NextResponse.json({ success: true, summary, models: status });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
