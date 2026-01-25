import { Router } from 'express';
import { articlesController } from '../controllers/articles.controller';

const router = Router();

/**
 * Get all articles
 * GET /api/articles?nicheId=...&status=...
 */
router.get('/', (req, res) => articlesController.list(req, res));

/**
 * Get public article by slug with full details
 * GET /api/articles/:nicheSlug/:articleSlug
 */
router.get('/:nicheSlug/:articleSlug', (req, res) => articlesController.getBySlug(req, res));

export default router;
