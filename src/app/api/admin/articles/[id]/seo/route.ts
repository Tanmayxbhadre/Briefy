import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { enhanceArticleSEO } from '@/lib/seo/publishGate';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, { params }: RouteParams) {
  await getAdminSession();
  const { id } = await params;
  const draft = await prisma.articleDraft.findUnique({
    where: { id },
    select: { seoWorkflowStatus: true, contentVersion: true, seoVersion: true, seoValidatedVersion: true, seoValidation: true, seoLastError: true, seoRetryCount: true },
  });
  if (!draft) return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  return NextResponse.json(draft);
}

export async function POST(_: Request, { params }: RouteParams) {
  await getAdminSession();
  const { id } = await params;
  try {
    const validation = await enhanceArticleSEO(id);
    return NextResponse.json({ success: true, validation });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SEO enhancement failed';
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
