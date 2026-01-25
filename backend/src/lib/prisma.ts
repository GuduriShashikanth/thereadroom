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
// Build connection URL with required SSL and connection settings for Supabase
function buildConnectionUrl(): string {
  const dbUrl = process.env.DATABASE_URL || '';
  
  // Log for debugging
  console.log('[Prisma] Configuring database connection...');
  console.log('[Prisma] DB Host:', dbUrl.includes('@') ? dbUrl.split('@')[1]?.split('/')[0] : 'not set');
  
  // If URL already has query params, append; otherwise add
  if (dbUrl.includes('?')) {
    // Check if sslmode is already set
    if (!dbUrl.includes('sslmode=')) {
      return `${dbUrl}&sslmode=require&connect_timeout=30`;
    }
    if (!dbUrl.includes('connect_timeout=')) {
      return `${dbUrl}&connect_timeout=30`;
    }
    return dbUrl;
  }
  
  // Add required params for Supabase
  return `${dbUrl}?sslmode=require&connect_timeout=30`;
}

const connectionUrl = buildConnectionUrl();

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
