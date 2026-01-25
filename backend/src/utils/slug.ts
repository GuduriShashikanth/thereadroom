/**
 * Slug Generation Utility
 * Creates URL-safe slugs from strings
 */

/**
 * Convert a string to a URL-safe slug
 * @param text - Input text to convert
 * @returns URL-safe slug
 * 
 * @example
 * generateSlug("How to Save Money Fast!") // "how-to-save-money-fast"
 * generateSlug("Personal Finance & Budgeting") // "personal-finance-budgeting"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Replace special characters with space
    .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, ' ')
    // Replace multiple spaces with single hyphen
    .replace(/\s+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Remove consecutive hyphens
    .replace(/-+/g, '-');
}

/**
 * Generate a unique slug by appending a suffix if needed
 * @param baseSlug - The base slug
 * @param existingSlugs - Array of existing slugs to avoid
 * @returns A unique slug
 * 
 * @example
 * ensureUniqueSlug("my-article", ["my-article"]) // "my-article-1"
 * ensureUniqueSlug("my-article", ["my-article", "my-article-1"]) // "my-article-2"
 */
export function ensureUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 1;
  let candidateSlug = `${baseSlug}-${counter}`;
  
  while (existingSlugs.includes(candidateSlug)) {
    counter++;
    candidateSlug = `${baseSlug}-${counter}`;
  }
  
  return candidateSlug;
}

/**
 * Validate a slug format
 * @param slug - Slug to validate
 * @returns True if valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  // Must be lowercase, alphanumeric with hyphens, no consecutive hyphens
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length > 0 && slug.length <= 200;
}

/**
 * Build the full URL path for an article
 * @param nicheSlug - The niche slug
 * @param articleSlug - The article slug
 * @returns Full URL path
 * 
 * @example
 * buildArticleUrl("personal-finance", "how-to-save-money") // "/personal-finance/how-to-save-money"
 */
export function buildArticleUrl(nicheSlug: string, articleSlug: string): string {
  return `/${nicheSlug}/${articleSlug}`;
}
