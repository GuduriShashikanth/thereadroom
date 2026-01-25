import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ArticleStatus } from '@prisma/client';

export class ArticlesController {
  /**
   * Get all articles, optionally filtered by niche
   */
  async list(req: Request, res: Response) {
    try {
      const { nicheId, status = 'PUBLISHED' } = req.query;

      const where: any = {};
      
      if (nicheId) {
        where.nicheId = String(nicheId);
      }

      if (status) {
        where.status = status as ArticleStatus;
      }

      const articles = await prisma.article.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          status: true,
          publishedAt: true,
          metaDescription: true,
          niche: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
      });

      res.json({ articles });
    } catch (error) {
      console.error('Error listing articles:', error);
      res.status(500).json({ error: 'Failed to fetch articles' });
    }
  }

  /**
   * Get public article by slug with full details
   */
  async getBySlug(req: Request, res: Response) {
    try {
      const { nicheSlug, articleSlug } = req.params;

      const article = await prisma.article.findFirst({
        where: {
          slug: String(articleSlug),
          niche: {
            slug: String(nicheSlug),
          },
          status: 'PUBLISHED',
        },
        include: {
          niche: true,
          keyword: true,
        },
      });

      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }

      res.json({ article });
    } catch (error) {
      console.error('Error getting article:', error);
      res.status(500).json({ error: 'Failed to fetch article' });
    }
  }
  /**
   * Create a new article manually
   * POST /api/admin/articles
   */
  async create(req: Request, res: Response) {
    try {
      const { title, content, metaDescription, niche: nicheName, status = 'DRAFT', slug: providedSlug } = req.body;

      if (!title || !content || !nicheName) {
        return res.status(400).json({ error: 'Missing required fields: title, content, niche' });
      }

      // 1. Handle Niche (Find or Create)
      const nicheSlug = (await import('../utils')).generateSlug(nicheName);
      let niche = await prisma.niche.findFirst({
        where: { OR: [{ slug: nicheSlug }, { name: nicheName }] }
      });

      if (!niche) {
        niche = await prisma.niche.create({
          data: { name: nicheName, slug: nicheSlug }
        });
      }

      // 2. Handle Article Slug
      const articleSlug = providedSlug || (await import('../utils')).generateSlug(title);

      // 3. Create Article
      const article = await prisma.article.create({
        data: {
          title,
          content,
          metaDescription: metaDescription || '',
          summary: '', // Optional for manual
          slug: articleSlug,
          nicheId: niche.id,
          status: status as ArticleStatus,
          // headings: [], // Empty for now
          faq: [], // Empty for now

        }
      });

      res.status(201).json({ article });
    } catch (error) {
      console.error('Error creating article:', error);
      res.status(500).json({ error: 'Failed to create article' });
    }
  }
  /**
   * Update article content and metadata (Prevents slug changes)
   * PUT /api/admin/articles/:id
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, content, metaDescription, summary, status, faq, headings } = req.body;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      // 1. Check if article exists
      const existing = await prisma.article.findUnique({
        where: { id },
        include: { niche: true },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Article not found' });
      }

      // 2. Update Article (Slug is immutable)
      const updated = await prisma.article.update({
        where: { id },
        data: {
          title: title || undefined,
          content: content || undefined,
          metaDescription: metaDescription || undefined,
          summary: summary || undefined,
          status: status as ArticleStatus || undefined,
          faq: faq || undefined,
          // headings: (Array.isArray(headings) ? headings : undefined) as string[] | undefined,
          updatedAt: new Date(), // Explicitly update timestamp
        },
      });

      console.log(`📝 Article updated: ${updated.slug}`);

      // 3. Trigger Frontend Revalidation (Best Effort)
      const frontendUrl = process.env.FRONTEND_URL || 'https://thereadroom.vercel.app';
      const secret = process.env.ADMIN_SECRET;
      
      if (existing.status === 'PUBLISHED' || updated.status === 'PUBLISHED') {
        const nicheSlug = existing.niche?.slug;
        if (nicheSlug) {
            fetch(`${frontendUrl}/api/revalidate?secret=${secret}&path=/${nicheSlug}/${existing.slug}`)
            .then(r => r.json())
            .then(d => console.log(`🔄 Revalidation requested:`, d))
            .catch(e => console.error(`⚠️ Revalidation failed:`, e.message));
        }
      }

      res.json({ article: updated });
    } catch (error) {
      console.error('Error updating article:', error);
      res.status(500).json({ error: 'Failed to update article' });
    }
  }
}

export const articlesController = new ArticlesController();
