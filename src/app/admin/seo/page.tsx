import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { SeoStudio } from '@/components/admin/SeoStudio';

export const metadata: Metadata = {
  title: 'SEO Studio | Admin Desk',
  description: 'AI-powered on-the-spot SEO check and fix',
};

// Force dynamic to ensure fresh drafts are fetched
export const dynamic = 'force-dynamic';

export default async function AdminSeoStudioPage() {
  // Fetch drafts that might need SEO review (DRAFT or REVIEW status)
  const pendingDrafts = await prisma.articleDraft.findMany({
    where: {
      status: {
        in: ['DRAFT', 'REVIEW'],
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50, // Process 50 at a time for performance
    include: {
      category: true,
    }
  });

  return <SeoStudio initialDrafts={pendingDrafts} />;
}
