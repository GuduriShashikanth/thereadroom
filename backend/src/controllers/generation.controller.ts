import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { generateSlug } from '../utils';

export class GenerationController {
  /**
   * Trigger content generation for a niche and keyword
   * POST /api/admin/generate
   */
  async generate(req: Request, res: Response) {
    try {
      const { niche: nicheNameOrSlug, keyword: keywordText } = req.body;

      if (!nicheNameOrSlug || !keywordText) {
        return res.status(400).json({
          error: 'Missing required fields: niche and keyword',
        });
      }

      // 1. Find or create Niche
      // We accept either slug or name
      const nicheSlug = generateSlug(nicheNameOrSlug);
      
      let niche = await prisma.niche.findFirst({
        where: {
          OR: [
            { slug: nicheSlug },
            { name: nicheNameOrSlug },
            { slug: nicheNameOrSlug },
          ],
        },
      });

      if (!niche) {
        // Auto-create niche if it doesn't exist (for easier admin workflow)
        niche = await prisma.niche.create({
          data: {
            name: nicheNameOrSlug, // Use original casing for name
            slug: nicheSlug,
          },
        });
      }

      // 2. Find or create Keyword
      const existingKeyword = await prisma.keyword.findFirst({
        where: {
          keyword: keywordText,
          nicheId: niche.id,
        },
      });

      let keywordId = existingKeyword?.id;

      if (!existingKeyword) {
        const keywordSlug = generateSlug(keywordText);
        const newKeyword = await prisma.keyword.create({
          data: {
            keyword: keywordText,
            slug: keywordSlug,
            nicheId: niche.id,
          },
        });
        keywordId = newKeyword.id;
      }

      // 3. Create Generation Log
      if (!keywordId) throw new Error('Failed to resolve keyword ID');

      const log = await prisma.generationLog.create({
        data: {
          keywordId,
          status: 'PENDING',
        },
      });

      // 4. Trigger Async Job (TODO: Connect to Queue/Orchestrator)
      // For now, we just return the pending status
      console.log(`🚀 Triggered generation for "${keywordText}" in "${niche.name}" (LogID: ${log.id})`);

      res.status(202).json({
        message: 'Content generation triggered successfully',
        logId: log.id,
        status: 'PENDING',
        niche: niche.name,
        keyword: keywordText,
      });

    } catch (error) {
      console.error('Generation trigger error:', error);
      res.status(500).json({ 
        error: 'Failed to trigger content generation',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get generation logs
   * GET /api/admin/logs
   */
  async getLogs(req: Request, res: Response) {
    try {
      const logs = await prisma.generationLog.findMany({
        take: 50,
        orderBy: {
          startedAt: 'desc',
        },
        include: {
          keyword: {
            include: {
              niche: true,
            },
          },
        },
      });

      res.json({ logs });
    } catch (error) {
      console.error('Error fetching logs:', error);
      res.status(500).json({ error: 'Failed to fetch generation logs' });
    }
  }
}

export const generationController = new GenerationController();
