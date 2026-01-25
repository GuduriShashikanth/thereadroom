import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { keywordGeneratorService } from '../services/keywords';

export class NicheController {
  /**
   * List all niches
   */
  async list(req: Request, res: Response) {
    try {
      const niches = await prisma.niche.findMany({
        orderBy: {
          name: 'asc',
        },
        include: {
          _count: {
            select: { articles: true, keywords: true },
          },
        },
      });

      res.json({ niches });
    } catch (error: any) {
      console.error('Error listing niches:', error);
      res.status(500).json({ error: 'Failed to list niches', details: error?.message || String(error) });
    }
  }

  /**
   * Get niche details by slug
   */
  async getBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;

      const niche = await prisma.niche.findUnique({
        where: { slug: String(slug) },
        include: {
          articles: {
            where: { status: 'PUBLISHED' },
            select: {
              id: true,
              title: true,
              slug: true,
              summary: true,
              publishedAt: true,
            },
            take: 10,
            orderBy: { publishedAt: 'desc' },
          },
        },
      });

      if (!niche) {
        return res.status(404).json({ error: 'Niche not found' });
      }

      res.json({ niche });
    } catch (error) {
      console.error('Error getting niche:', error);
      res.status(500).json({ error: 'Failed to fetch niche' });
    }
  }

  /**
   * Create a new niche (Admin)
   * Triggers automatic keyword generation asynchronously after creation.
   */
  async create(req: Request, res: Response) {
    try {
      const { name, slug, description } = req.body;

      if (!name || !slug) {
        return res.status(400).json({ error: 'Name and slug are required' });
      }

      const niche = await prisma.niche.create({
        data: {
          name,
          slug,
          description,
        },
      });

      // Trigger automatic keyword generation (async, non-blocking)
      // This runs in the background - niche creation must NOT fail if this fails
      keywordGeneratorService.generateInitialKeywords(
        niche.id,
        niche.name,
        niche.description || ''
      ).catch(err => {
        console.error('[NicheController] Async keyword generation failed:', err.message);
      });

      res.status(201).json({ 
        niche,
        message: 'Niche created. Keywords are being generated in the background.'
      });
    } catch (error) {
      console.error('Error creating niche:', error);
      res.status(500).json({ error: 'Failed to create niche' });
    }
  }
}

export const nicheController = new NicheController();
