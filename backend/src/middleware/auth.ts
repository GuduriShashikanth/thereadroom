import { Request, Response, NextFunction } from 'express';

const ADMIN_SECRET = process.env.ADMIN_SECRET;

if (!ADMIN_SECRET) {
  console.error('[Auth] ADMIN_SECRET is not defined in environment variables.');
}

export const validateAdminAccess = (req: Request, res: Response, next: NextFunction) => {
  if (!ADMIN_SECRET) {
    return res.status(500).json({ error: 'Server misconfiguration: Auth not initialized' });
  }

  const secret = req.headers['x-admin-secret'];

  // Check if secret matches
  if (!secret || secret !== ADMIN_SECRET) {
    console.warn(`[Auth] Unauthorized admin access attempt from ${req.ip}`);
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing admin secret' });
  }

  next();
};
