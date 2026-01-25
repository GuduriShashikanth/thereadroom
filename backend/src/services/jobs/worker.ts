import { prisma } from '../../lib/prisma';
import { contentGenerator } from '../content/generator';
import { keywordGeneratorService } from '../keywords';
import { Prisma } from '@prisma/client';

const MAX_DAILY_ARTICLES = 2;
const MAX_RETRIES = 3;

/**
 * Source priority ordering for keyword selection.
 * MANUAL keywords (human-defined) always take priority over AI-generated ones.
 */
const SOURCE_PRIORITY_ORDER: Record<string, number> = {
  'MANUAL': 1,
  'SEED': 2,
  'AUTO': 3,
  'AUTO_REFILL': 4,
};

/**
 * Core worker logic for processing content generation jobs.
 * 
 * FLOW:
 * 1. Check daily rate limit
 * 2. Find AVAILABLE keywords ordered by:
 *    - Source priority (MANUAL > SEED > AUTO > AUTO_REFILL)
 *    - Created date (oldest first)
 * 3. If no keywords available, trigger auto-refill for exhausted niches
 * 4. Process keyword: generate content, save article, mark keyword as USED
 * 5. Handle failures with retry logic (max 3 retries)
 */
export async function processGenerationQueue() {
  try {
    console.log('🔄 [Worker] Checking generation queue...');

    // 0. Database Recovery: Reset stuck IN_PROGRESS jobs older than 10 mins
    await prisma.generationLog.updateMany({
      where: {
        status: 'IN_PROGRESS',
        startedAt: {
          lt: new Date(Date.now() - 10 * 60 * 1000),
        },
      },
      data: {
        status: 'FAILED',
        errorMessage: 'Recovered from crash - timeout',
      },
    });

    // 1. Check Daily Rate Limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyCount = await prisma.article.count({
      where: {
        publishedAt: {
          gte: today,
        },
      },
    });

    if (dailyCount >= MAX_DAILY_ARTICLES) {
      console.log(`⚠️ [Worker] Daily limit reached (${dailyCount}/${MAX_DAILY_ARTICLES}). Skipping.`);
      return;
    }

    // 2. Check for existing pending/failed jobs first (for retry)
    // Only retry jobs that haven't exceeded MAX_RETRIES
    const pendingJob = await prisma.generationLog.findFirst({
      where: {
        OR: [
          { status: 'PENDING' },
          { 
            status: 'FAILED',
            retryCount: { lt: MAX_RETRIES },
          },
        ],
      },
      orderBy: { startedAt: 'asc' },
      include: {
        keyword: {
          include: { niche: true },
        },
      },
    });

    if (pendingJob) {
      await processJob(pendingJob);
      return;
    }

    // 3. Find AVAILABLE keywords with PRIORITY ORDERING
    // Priority: MANUAL > SEED > AUTO > AUTO_REFILL, then by createdAt (oldest first)
    const availableKeyword = await findNextKeywordByPriority();

    if (!availableKeyword) {
      // 4. No keywords available - check for exhausted niches and trigger refill
      console.log('⚠️ [Worker] No available keywords. Checking for exhausted niches...');
      await triggerRefillForExhaustedNiches();
      return;
    }

    console.log(`📋 [Worker] Selected keyword: "${availableKeyword.keyword}" (source: ${availableKeyword.source})`);

    // 5. Create a GenerationLog entry
    const log = await prisma.generationLog.create({
      data: {
        keywordId: availableKeyword.id,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        retryCount: 0,
      },
    });

    // 6. Process the generation
    await processKeyword(availableKeyword, log.id, 0);

  } catch (error: any) {
    console.error(`❌ [Worker] Critical Error:`, error.message);
    if (error.code) console.error('Error Code:', error.code);
  }
}

/**
 * Find the next available keyword using priority ordering.
 * Priority: MANUAL > SEED > AUTO > AUTO_REFILL
 * Secondary sort: createdAt ASC (oldest first)
 */
async function findNextKeywordByPriority() {
  // Get all available keywords
  const availableKeywords = await prisma.keyword.findMany({
    where: {
      status: 'AVAILABLE',
      used: false,
    },
    include: {
      niche: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (availableKeywords.length === 0) {
    return null;
  }

  // Sort by source priority, then by createdAt
  availableKeywords.sort((a, b) => {
    const priorityA = SOURCE_PRIORITY_ORDER[a.source] || 99;
    const priorityB = SOURCE_PRIORITY_ORDER[b.source] || 99;
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // Same priority - sort by createdAt
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return availableKeywords[0];
}

/**
 * Check for niches with no available keywords and trigger refill.
 * This ensures automation can continue even when keywords are exhausted.
 */
async function triggerRefillForExhaustedNiches() {
  try {
    // Find niches that have 0 available keywords
    const nicheStats = await prisma.niche.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            keywords: true,
          },
        },
        keywords: {
          where: {
            status: 'AVAILABLE',
            used: false,
          },
          select: { id: true },
        },
      },
    });

    // Filter to niches with keywords but none available (exhausted)
    const exhaustedNiches = nicheStats.filter(n => 
      n._count.keywords > 0 && n.keywords.length === 0
    );

    if (exhaustedNiches.length === 0) {
      console.log('✅ [Worker] No exhausted niches found. Queue is truly empty.');
      return;
    }

    console.log(`🔄 [Worker] Found ${exhaustedNiches.length} exhausted niche(s). Triggering refill...`);

    // Trigger refill for each exhausted niche (async, don't block)
    for (const niche of exhaustedNiches) {
      try {
        await keywordGeneratorService.generateRefillKeywords(niche.id, niche.name);
      } catch (err: any) {
        console.error(`[Worker] Refill failed for "${niche.name}":`, err.message);
        // Continue to next niche - don't stop global automation
      }
    }

  } catch (error: any) {
    console.error('[Worker] Failed to check for exhausted niches:', error.message);
  }
}

/**
 * Process a pending/failed GenerationLog job (retry path)
 */
async function processJob(job: any) {
  const retryCount = (job.retryCount || 0) + 1;
  
  console.log(`🔄 [Worker] Retrying job ${job.id} (attempt ${retryCount}/${MAX_RETRIES}) for "${job.keyword.keyword}"`);

  await prisma.generationLog.update({
    where: { id: job.id },
    data: { 
      status: 'IN_PROGRESS', 
      startedAt: new Date(),
      retryCount,
    },
  });

  await processKeyword(job.keyword, job.id, retryCount);
}

/**
 * Generate content for a keyword and save article.
 * Uses a transaction to ensure atomicity.
 */
async function processKeyword(keyword: any, logId: string, retryCount: number) {
  const niche = keyword.niche;

  try {
    console.log(`🚀 [Worker] Generating article for: "${keyword.keyword}" in "${niche.name}"`);

    // Generate content via AI
    const payload = await contentGenerator.generateArticle(niche.name, keyword.keyword);

    // Atomic transaction: Create article + Mark keyword as USED + Update log
    await prisma.$transaction(async (tx) => {
      // Create Article
      const article = await tx.article.create({
        data: {
          title: payload.title,
          slug: payload.slug,
          metaDescription: payload.metaDescription,
          summary: payload.shortAnswer,
          content: payload.content,
          faq: payload.faq || [],
          status: 'PUBLISHED',
          publishedAt: new Date(),
          niche: { connect: { id: niche.id } },
          keyword: { connect: { id: keyword.id } },
        },
      });

      // Mark keyword as USED (both status and used flag)
      await tx.keyword.update({
        where: { id: keyword.id },
        data: {
          status: 'USED',
          used: true,
          usedAt: new Date(),
        },
      });

      // Update log to COMPLETED
      await tx.generationLog.update({
        where: { id: logId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          articleId: article.id,
        },
      });

      console.log(`✨ [Worker] SUCCESS: Article "${article.slug}" created.`);
    });

  } catch (error: any) {
    console.error(`❌ [Worker] Generation failed for "${keyword.keyword}":`, error.message);

    // Check if we've exceeded max retries
    if (retryCount >= MAX_RETRIES) {
      console.error(`🛑 [Worker] Max retries (${MAX_RETRIES}) exceeded for "${keyword.keyword}". Marking as PERMANENT_FAILURE.`);
      
      await prisma.generationLog.update({
        where: { id: logId },
        data: {
          status: 'PERMANENT_FAILURE',
          errorMessage: `Max retries exceeded: ${error.message || 'Unknown error'}`,
          completedAt: new Date(),
        },
      });
      
      // Keyword stays AVAILABLE but will be skipped due to PERMANENT_FAILURE log
      // Admin can manually reset the log or mark keyword as RESERVED
    } else {
      // Update log to FAILED (will be retried)
      await prisma.generationLog.update({
        where: { id: logId },
        data: {
          status: 'FAILED',
          errorMessage: error.message || 'Unknown error',
          completedAt: new Date(),
        },
      });
      
      // Keyword stays AVAILABLE - will be retried
    }
  }
}
