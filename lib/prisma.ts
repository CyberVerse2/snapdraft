import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const datasourceUrl = process.env.DATABASE_URL;
if (!datasourceUrl) {
  // Helpful message in server logs if env is missing at runtime
  console.error(
    'Prisma: DATABASE_URL is not set. Create a .env at project root with DATABASE_URL or configure your hosting env.'
  );
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
    datasourceUrl
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
