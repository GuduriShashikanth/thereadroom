import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { KeywordStatus, KeywordSource } from '@prisma/client';

/**
 * Generate a URL-safe slug from a keyword string.
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Valid intent types for keywords.
 */
const VALID_INTENTS = ['informational', 'how-to', 'list'] as const;
type KeywordIntent = typeof VALID_INTENTS[number];

/**
 * Valid source types for keywords.
 */
const VALID_SOURCES: KeywordSource[] = ['MANUAL', 'SEED', 'AUTO', 'AUTO_REFILL'];

/**
 * Valid status types for keywords.
 */
const VALID_STATUSES: KeywordStatus[] = ['AVAILABLE', 'RESERVED', 'USED'];

export class KeywordController {
  /**
   * Create a new keyword for a niche.
   * POST /api/admin/keywords
   * Body: { nicheId, keyword, intent?, source? }
   */
  async create(req: Request, res: Response) {
    try {
      const { nicheId, keyword, intent = 'informational', source = 'MANUAL' } = req.body;

      // Validation
      if (!nicheId || !keyword) {
        return res.status(400).json({ error: 'nicheId and keyword are required' });
      }

      if (typeof keyword !== 'string' || keyword.length < 3 || keyword.length > 200) {
        return res.status(400).json({ error: 'Keyword must be a string between 3 and 200 characters' });
      }

      if (!VALID_INTENTS.includes(intent as KeywordIntent)) {
        return res.status(400).json({ error: `Intent must be one of: ${VALID_INTENTS.join(', ')}` });
      }

      if (!VALID_SOURCES.includes(source as KeywordSource)) {
        return res.status(400).json({ error: `Source must be one of: ${VALID_SOURCES.join(', ')}` });
      }

      // Check niche exists
      const niche = await prisma.niche.findUnique({ where: { id: nicheId } });
      if (!niche) {
        return res.status(404).json({ error: 'Niche not found' });
      }

      // Generate slug
      const slug = generateSlug(keyword);

      // Check for duplicate keyword or slug in niche
      const existing = await prisma.keyword.findFirst({
        where: {
          nicheId,
          OR: [{ keyword }, { slug }],
        },
      });

      if (existing) {
        return res.status(409).json({ error: 'Keyword or slug already exists in this niche' });
      }

      // Create keyword
      const newKeyword = await prisma.keyword.create({
        data: {
          nicheId,
          keyword,
          slug,
          intent,
          source: source as KeywordSource,
          status: 'AVAILABLE',
          used: false,
        },
      });

      res.status(201).json({ keyword: newKeyword });
    } catch (error: any) {
      console.error('[KeywordController] Error creating keyword:', error);
      res.status(500).json({ error: 'Failed to create keyword', details: error?.message });
    }
  }

  /**
   * List keywords for a niche (or all if no nicheId provided).
   * GET /api/admin/keywords?nicheId=...&unused=true&status=AVAILABLE
   */
  async list(req: Request, res: Response) {
    try {
      const { nicheId, unused, status, source } = req.query;

      const where: any = {};
      if (nicheId) {
        where.nicheId = String(nicheId);
      }
      if (unused === 'true') {
        where.used = false;
      }
      if (status && VALID_STATUSES.includes(status as KeywordStatus)) {
        where.status = status;
      }
      if (source && VALID_SOURCES.includes(source as KeywordSource)) {
        where.source = source;
      }

      const keywords = await prisma.keyword.findMany({
        where,
        orderBy: [
          { createdAt: 'asc' },
        ],
        include: {
          niche: {
            select: { name: true, slug: true },
          },
        },
      });

      // Calculate stats
      const stats = {
        total: keywords.length,
        available: keywords.filter(k => k.status === 'AVAILABLE').length,
        used: keywords.filter(k => k.status === 'USED').length,
        reserved: keywords.filter(k => k.status === 'RESERVED').length,
        bySource: {
          MANUAL: keywords.filter(k => k.source === 'MANUAL').length,
          SEED: keywords.filter(k => k.source === 'SEED').length,
          AUTO: keywords.filter(k => k.source === 'AUTO').length,
          AUTO_REFILL: keywords.filter(k => k.source === 'AUTO_REFILL').length,
        },
      };

      res.json({ keywords, count: keywords.length, stats });
    } catch (error: any) {
      console.error('[KeywordController] Error listing keywords:', error);
      res.status(500).json({ error: 'Failed to list keywords', details: error?.message });
    }
  }

  /**
   * Bulk create keywords for a niche.
   * POST /api/admin/keywords/bulk
   * Body: { nicheId: string, keywords: [{ keyword: string, intent?: string }], source?: string }
   */
  async bulkCreate(req: Request, res: Response) {
    try {
      const { nicheId, keywords, source = 'MANUAL' } = req.body;

      if (!nicheId || !Array.isArray(keywords) || keywords.length === 0) {
        return res.status(400).json({ error: 'nicheId and a non-empty keywords array are required' });
      }

      if (!VALID_SOURCES.includes(source as KeywordSource)) {
        return res.status(400).json({ error: `Source must be one of: ${VALID_SOURCES.join(', ')}` });
      }

      // Check niche exists
      const niche = await prisma.niche.findUnique({ where: { id: nicheId } });
      if (!niche) {
        return res.status(404).json({ error: 'Niche not found' });
      }

      const results = { created: 0, skipped: 0, errors: [] as string[] };

      for (const item of keywords) {
        const keywordText = typeof item === 'string' ? item.trim() : item.keyword?.trim();
        const intent = typeof item === 'string' ? 'informational' : (item.intent || 'informational');

        if (!keywordText || keywordText.length < 3 || keywordText.length > 200) {
          results.skipped++;
          results.errors.push(`Invalid keyword: "${keywordText}"`);
          continue;
        }

        const slug = generateSlug(keywordText);

        try {
          await prisma.keyword.create({
            data: {
              nicheId,
              keyword: keywordText,
              slug,
              intent,
              source: source as KeywordSource,
              status: 'AVAILABLE',
              used: false,
            },
          });
          results.created++;
        } catch (e: any) {
          // Likely duplicate
          results.skipped++;
          results.errors.push(`Skipped (duplicate): "${keywordText}"`);
        }
      }

      res.status(201).json(results);
    } catch (error: any) {
      console.error('[KeywordController] Error bulk creating keywords:', error);
      res.status(500).json({ error: 'Bulk create failed', details: error?.message });
    }
  }

  /**
   * Update a keyword's status.
   * PATCH /api/admin/keywords/:id
   * Body: { status?: 'AVAILABLE' | 'RESERVED' | 'USED' }
   */
  async update(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const { status } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Keyword ID is required' });
      }

      // Check keyword exists
      const existing = await prisma.keyword.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'Keyword not found' });
      }

      // Validate status if provided
      if (status && !VALID_STATUSES.includes(status as KeywordStatus)) {
        return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
      }

      const updateData: any = {};
      if (status) {
        updateData.status = status as KeywordStatus;
        // If marking as USED, also set used flag and timestamp
        if (status === 'USED') {
          updateData.used = true;
          updateData.usedAt = new Date();
        }
        // If reverting to AVAILABLE, reset used flag
        if (status === 'AVAILABLE') {
          updateData.used = false;
          updateData.usedAt = null;
        }
      }

      const updated = await prisma.keyword.update({
        where: { id },
        data: updateData,
      });

      res.json({ keyword: updated });
    } catch (error: any) {
      console.error('[KeywordController] Error updating keyword:', error);
      res.status(500).json({ error: 'Failed to update keyword', details: error?.message });
    }
  }

  /**
   * Delete a keyword.
   * DELETE /api/admin/keywords/:id
   */
  async delete(req: Request, res: Response) {
    try {
      const id = String(req.params.id);

      if (!id) {
        return res.status(400).json({ error: 'Keyword ID is required' });
      }

      // Check keyword exists
      const existing = await prisma.keyword.findUnique({ 
        where: { id },
        include: { articles: true },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Keyword not found' });
      }

      // Warn if keyword has articles (don't block, just inform)
      const hasArticles = existing.articles.length > 0;

      await prisma.keyword.delete({ where: { id } });

      res.json({ 
        success: true, 
        message: hasArticles 
          ? 'Keyword deleted. Note: Associated article(s) still exist but are now unlinked.' 
          : 'Keyword deleted successfully.' 
      });
    } catch (error: any) {
      console.error('[KeywordController] Error deleting keyword:', error);
      res.status(500).json({ error: 'Failed to delete keyword', details: error?.message });
    }
  }
}

export const keywordController = new KeywordController();

