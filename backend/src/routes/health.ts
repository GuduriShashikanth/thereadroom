import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Health check endpoint
 * GET /health
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Lightweight health check endpoint
 * HEAD /health
 * Returns 200 OK with no body - useful for load balancers and monitoring
 */
router.head('/', (req: Request, res: Response) => {
  res.status(200).end();
});

export default router;
