import { PrismaClient } from '@prisma/client';

// Global Prisma client instance
// Using singleton pattern to prevent multiple instances in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Build connection URL with proper settings for Supabase
 * Handles both pooler (6543) and direct (5432) connections
 */
function buildConnectionUrl(): string {
  const dbUrl = process.env.DATABASE_URL || '';
  
  console.log('[Prisma] Configuring database connection...');
  
  if (!dbUrl) {
    console.error('[Prisma] DATABASE_URL is not set!');
    return '';
  }
  
  // Extract host info for logging (hide password)
  const hostMatch = dbUrl.match(/@([^/]+)/);
  console.log('[Prisma] DB Host:', hostMatch ? hostMatch[1] : 'unknown');
  
  // Detect if using pooler (port 6543) or direct (port 5432)
  const isPooler = dbUrl.includes(':6543') || dbUrl.includes('pooler.supabase.com');
  console.log('[Prisma] Connection mode:', isPooler ? 'Pooler (PgBouncer)' : 'Direct');
  
  // Build params based on connection type
  const params: string[] = [];
  
  // SSL is required for both
  if (!dbUrl.includes('sslmode=')) {
    params.push('sslmode=require');
  }
  
  // For pooler connections, add pgbouncer settings
  if (isPooler) {
    if (!dbUrl.includes('pgbouncer=')) {
      params.push('pgbouncer=true');
    }
    // Limit connections for serverless
    if (!dbUrl.includes('connection_limit=')) {
      params.push('connection_limit=1');
    }
  }
  
  // Connection timeout
  if (!dbUrl.includes('connect_timeout=')) {
    params.push('connect_timeout=15');
  }
  
  // Build final URL
  if (params.length === 0) {
    return dbUrl;
  }
  
  const separator = dbUrl.includes('?') ? '&' : '?';
  return `${dbUrl}${separator}${params.join('&')}`;
}

const connectionUrl = buildConnectionUrl();
console.log('[Prisma] Connection URL configured (params only):', 
  connectionUrl.includes('?') ? connectionUrl.split('?')[1] : 'no params');

export const prisma = globalThis.prisma ?? new PrismaClient({
  log: ['error', 'warn'],
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
