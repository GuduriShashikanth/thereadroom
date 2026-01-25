// TypeScript interfaces matching Prisma schema
// These provide type-safe DTOs for API responses

// ============================================
// ENUMS (matching Prisma enums)
// ============================================

export enum ArticleStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export enum GenerationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// ============================================
// BASE INTERFACES
// ============================================

/**
 * FAQ item for GEO optimization
 * Stored as JSON array in Article.faq
 */
export interface FAQ {
  question: string;
  answer: string;
}

/**
 * Niche - Content category/vertical
 * URL segment: /{niche.slug}/...
 */
export interface Niche {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Keyword - Target search term for content generation
 */
export interface Keyword {
  id: string;
  keyword: string;
  nicheId: string;
  searchVolume: number | null;
  difficulty: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Article - SEO-optimized content piece
 * Full URL: /{niche.slug}/{article.slug}
 */
export interface Article {
  id: string;
  slug: string;
  title: string;
  metaDescription: string;
  summary: string;
  content: string;
  faq: FAQ[];
  status: ArticleStatus;
  nicheId: string;
  keywordId: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

/**
 * GenerationLog - Tracks AI content generation attempts
 */
export interface GenerationLog {
  id: string;
  keywordId: string;
  articleId: string | null;
  status: GenerationStatus;
  errorMessage: string | null;
  startedAt: Date;
  completedAt: Date | null;
  promptTokens: number | null;
  outputTokens: number | null;
}

// ============================================
// EXTENDED INTERFACES (with relations)
// ============================================

/**
 * Niche with all related data
 */
export interface NicheWithRelations extends Niche {
  keywords?: Keyword[];
  articles?: Article[];
  _count?: {
    keywords: number;
    articles: number;
  };
}

/**
 * Keyword with niche relation
 */
export interface KeywordWithNiche extends Keyword {
  niche: Niche;
}

/**
 * Article with all relations for display
 */
export interface ArticleWithRelations extends Article {
  niche: Niche;
  keyword?: Keyword | null;
}

/**
 * Article for list views (lighter payload)
 */
export interface ArticleListItem {
  id: string;
  slug: string;
  title: string;
  metaDescription: string;
  summary: string;
  status: ArticleStatus;
  nicheSlug: string;
  createdAt: Date;
  publishedAt: Date | null;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

/**
 * Request body for triggering content generation
 */
export interface GenerateContentRequest {
  nicheSlug: string;
  keyword: string;
}

/**
 * Response from content generation trigger
 */
export interface GenerateContentResponse {
  success: boolean;
  logId: string;
  message: string;
}

/**
 * Article creation input (from AI generation)
 */
export interface CreateArticleInput {
  nicheId: string;
  keywordId: string;
  title: string;
  slug: string;
  metaDescription: string;
  summary: string;
  content: string;
  faq: FAQ[];
}
