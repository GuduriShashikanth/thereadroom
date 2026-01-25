import { Router } from 'express';
import { generationController } from '../controllers/generation.controller';
import { nicheController } from '../controllers/niches.controller';
import { keywordController } from '../controllers/keywords.controller';
import { validateAdminAccess } from '../middleware/auth';
import { upload } from '../middleware/upload';
import path from 'path';
import fs from 'fs';
import fm from 'front-matter';

const router = Router();

// Apply authentication to all admin routes
router.use(validateAdminAccess);

/**
 * Trigger content generation
 * POST /api/admin/generate
 * Body: { niche: string, keyword: string }
 */
router.post('/generate', (req, res) => generationController.generate(req, res));

/**
 * Get generation logs
 * GET /api/admin/logs
 */
router.get('/logs', (req, res) => generationController.getLogs(req, res));

// --- NICHE ROUTES ---

/**
 * List all niches
 * GET /api/admin/niches
 */
router.get('/niches', (req, res) => nicheController.list(req, res));

/**
 * Create a new niche manually
 * POST /api/admin/niches
 */
router.post('/niches', (req, res) => nicheController.create(req, res));

// --- KEYWORD ROUTES ---

/**
 * List keywords (optionally filtered by nicheId or unused)
 * GET /api/admin/keywords?nicheId=...&unused=true
 */
router.get('/keywords', (req, res) => keywordController.list(req, res));

/**
 * Create a new keyword
 * POST /api/admin/keywords
 */
router.post('/keywords', (req, res) => keywordController.create(req, res));

/**
 * Bulk create keywords
 * POST /api/admin/keywords/bulk
 */
router.post('/keywords/bulk', (req, res) => keywordController.bulkCreate(req, res));

/**
 * Update a keyword (e.g., change status)
 * PATCH /api/admin/keywords/:id
 */
router.patch('/keywords/:id', (req, res) => keywordController.update(req, res));

/**
 * Delete a keyword
 * DELETE /api/admin/keywords/:id
 */
router.delete('/keywords/:id', (req, res) => keywordController.delete(req, res));

/**
 * Create a new article manually
 * POST /api/admin/articles
 */
router.post('/articles', (req, res) => {
  // Lazy load to avoid circular dependencies if any, though unlikely here
  import('../controllers/articles.controller').then(({ articlesController }) => {
    articlesController.create(req, res)
  });
});

/**
 * Update an article
 * PUT /api/admin/articles/:id
 */
router.put('/articles/:id', (req, res) => {
  import('../controllers/articles.controller').then(({ articlesController }) => {
    articlesController.update(req, res)
  });
});

/**
 * Upload Image (Local Storage)
 * POST /api/admin/upload/image
 */
router.post('/upload/image', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // Return public URL (requires static serve in index.ts)
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

/**
 * Import Article from Markdown
 * POST /api/admin/upload/markdown
 */
router.post('/upload/markdown', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Parse Frontmatter
    const { attributes, body } = fm<any>(fileContent);
    const { title, niche, description, metaDescription } = attributes;

    if (!title || !niche) {
      // Clean up file
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Markdown missing required frontmatter: title, niche' });
    }

    // Call Controller to Create
    // Dynamically import to reuse logic
    const { articlesController } = await import('../controllers/articles.controller');
    
    // Convert to Request-like object or refactor controller. 
    // Here we will mock the Request/Response for reuse or call internal logic if refactored.
    // For simplicity, we'll manually invoke the creation logic via a proper object.
    
    // Hack: Reuse Controller logic by constructing a synthetic request
    req.body = {
        title,
        niche, // Niche Name from frontmatter
        content: body,
        metaDescription: metaDescription || description || '',
        status: 'DRAFT'
    };

    // Controller sends response, so we just pass through
    await articlesController.create(req, res);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Import failed' });
  }
});

export default router;
