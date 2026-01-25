import { PrismaClient } from '@prisma/client';

// Global Prisma client instance
// Using singleton pattern to prevent multiple instances in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Prisma client instance
 * In development, we store it in globalThis to prevent multiple instances
 * during hot reloading with nodemon
 */
// Fix for Supabase connection stability
const dbUrl = process.env.DATABASE_URL;
const connectionUrl = dbUrl && !dbUrl.includes('?') 
  ? `${dbUrl}?sslmode=require` 
  : dbUrl;

export const prisma = globalThis.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  datasources: {
    db: {
      url: connectionUrl,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

/**
 * Graceful shutdown - disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

export default prisma;
