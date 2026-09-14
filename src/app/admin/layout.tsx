import type { Metadata } from 'next';
import React from 'react';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { AdminLayoutClient } from '@/components/admin/AdminLayout';

export const dynamic = 'force-dynamic';

// robots.txt disallow does not deindex already-indexed URLs — an explicit
// noindex on the admin area guarantees it stays out of search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  // If user is not authenticated, let middleware/pages handle redirection to login
  if (!session.authenticated) {
    return <>{children}</>;
  }

  // Get real sidebar badge counts from DB
  const [discoveredCount, draftsCount] = await Promise.all([
    prisma.newsItem.count({
      where: { status: { in: ['DISCOVERED', 'REVIEW'] } },
    }),
    prisma.articleDraft.count({
      where: { status: { in: ['DRAFT', 'REVIEW', 'APPROVED'] } },
    }),
  ]);

  return (
    <AdminLayoutClient
      user={session.user || 'Admin Editor'}
      counts={{
        discovered: discoveredCount,
        drafts: draftsCount,
      }}
    >
      {children}
    </AdminLayoutClient>
  );
}
