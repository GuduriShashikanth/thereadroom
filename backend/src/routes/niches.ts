import { Router } from 'express';
import { nicheController } from '../controllers/niches.controller';

const router = Router();

/**
 * List all niches
 * GET /api/niches
 */
router.get('/', (req, res) => nicheController.list(req, res));

/**
 * Get niche details
 * GET /api/niches/:slug
 */
router.get('/:slug', (req, res) => nicheController.getBySlug(req, res));

export default router;
