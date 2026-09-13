import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const isProductionBuild = process.env.NEXT_PHASE === 'phase-production-build';
const databaseUrl =
  process.env.DATABASE_URL || (isProductionBuild ? 'file:/tmp/briefy-build.db' : undefined);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
