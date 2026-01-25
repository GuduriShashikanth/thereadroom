import { prisma } from '../../lib/prisma';
import { aiService } from '../ai';
import { KeywordSource } from '@prisma/client';
import { INDIA_LOCALE_CONTEXT } from '../../config/locale.config';

/**
 * Interface for AI-generated keyword
 */
interface GeneratedKeyword {
  keyword: string;
  intent: 'informational' | 'how-to' | 'list';
}

/**
 * AI Prompt for generating India-focused, SEO-safe keywords
 */
const KEYWORD_GENERATION_PROMPT = `You are an SEO keyword research expert specializing in content for Indian audiences.

Generate unique, long-tail keywords for the given niche. Each keyword must be:
1. INFORMATIONAL, HOW-TO, or LIST-BASED - never transactional/commercial
2. India-focused where relevant (include "in India", "for Indians", etc.)
3. Long-tail (4-8 words) for better SEO targeting
4. Safe for all audiences (no controversial, political, or adult topics)
5. Actionable and search-worthy

Example good keywords:
- "how to save money as a student in india"
- "best budget travel destinations in india under 5000"
- "top 10 healthy breakfast recipes for indian families"
- "how to start investing in mutual funds india beginners"

DO NOT generate:
- Transactional keywords (buy, price, cheap, discount)
- Brand-specific keywords
- Duplicate or very similar keywords
- Keywords shorter than 4 words

Return a JSON object with this exact structure:
{
  "keywords": [
    { "keyword": "your keyword here", "intent": "informational" },
    { "keyword": "another keyword here", "intent": "how-to" }
  ]
}`;

/**
 * Generate a URL-safe slug from a keyword string.
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * KeywordGeneratorService
 * 
 * Handles AI-powered keyword generation for:
 * 1. Initial keyword creation when a new niche is added
 * 2. Automatic keyword refill when a niche exhausts its keywords
 */
class KeywordGeneratorService {
  private defaultInitialCount = 15;
  private defaultRefillCount = 15;

  /**
   * Generate initial keywords for a newly created niche.
   * Called asynchronously after niche creation.
   * 
   * @param nicheId - The ID of the newly created niche
   * @param nicheName - Display name of the niche
   * @param nicheDescription - Optional description for context
   */
  async generateInitialKeywords(
    nicheId: string,
    nicheName: string,
    nicheDescription: string = ''
  ): Promise<{ created: number; skipped: number; errors: string[] }> {
    console.log(`🔑 [KeywordGenerator] Generating initial keywords for niche: "${nicheName}"`);

    try {
      // Get existing keywords to avoid duplicates
      const existingKeywords = await prisma.keyword.findMany({
        where: { nicheId },
        select: { keyword: true },
      });
      const existingSet = new Set(existingKeywords.map(k => k.keyword.toLowerCase()));

      // Generate keyword ideas via AI
      const ideas = await this.generateKeywordIdeas(
        nicheName,
        nicheDescription,
        Array.from(existingSet),
        this.defaultInitialCount
      );

      // Store keywords
      const result = await this.storeKeywords(nicheId, ideas, 'AUTO');

      console.log(`✅ [KeywordGenerator] Created ${result.created} keywords for "${nicheName}" (skipped: ${result.skipped})`);
      return result;

    } catch (error: any) {
      console.error(`❌ [KeywordGenerator] Failed to generate initial keywords for "${nicheName}":`, error.message);
      // Return empty result - niche creation should NOT fail
      return { created: 0, skipped: 0, errors: [error.message] };
    }
  }

  /**
   * Generate refill keywords for an exhausted niche.
   * Called by the worker when a niche has no available keywords.
   * 
   * @param nicheId - The ID of the exhausted niche
   * @param nicheName - Display name of the niche
   */
  async generateRefillKeywords(
    nicheId: string,
    nicheName: string
  ): Promise<{ created: number; skipped: number; errors: string[] }> {
    console.log(`🔄 [KeywordGenerator] Refilling keywords for exhausted niche: "${nicheName}"`);

    try {
      // Get ALL existing keywords (both used and unused) to avoid duplicates
      const existingKeywords = await prisma.keyword.findMany({
        where: { nicheId },
        select: { keyword: true },
      });
      const existingSet = new Set(existingKeywords.map(k => k.keyword.toLowerCase()));

      // Get niche description for context
      const niche = await prisma.niche.findUnique({
        where: { id: nicheId },
        select: { description: true },
      });

      // Generate keyword ideas via AI
      const ideas = await this.generateKeywordIdeas(
        nicheName,
        niche?.description || '',
        Array.from(existingSet),
        this.defaultRefillCount
      );

      // Store keywords with AUTO_REFILL source
      const result = await this.storeKeywords(nicheId, ideas, 'AUTO_REFILL');

      console.log(`✅ [KeywordGenerator] Refilled ${result.created} keywords for "${nicheName}" (skipped: ${result.skipped})`);
      return result;

    } catch (error: any) {
      console.error(`❌ [KeywordGenerator] Failed to refill keywords for "${nicheName}":`, error.message);
      // Return empty result - automation should NOT stop
      return { created: 0, skipped: 0, errors: [error.message] };
    }
  }

  /**
   * Core AI generation logic.
   * Generates keyword ideas using the AI service.
   */
  private async generateKeywordIdeas(
    nicheName: string,
    nicheDescription: string,
    existingKeywords: string[],
    count: number
  ): Promise<GeneratedKeyword[]> {
    const userPrompt = `
Niche: ${nicheName}
Description: ${nicheDescription || 'General content in this category'}

Generate exactly ${count} unique, long-tail keywords for this niche.
Focus on India-focused, informational content that would help Indian readers.

${existingKeywords.length > 0 ? `
AVOID these existing keywords (do not generate duplicates or very similar ones):
${existingKeywords.slice(0, 50).join('\n')}
` : ''}

Return ONLY a valid JSON object with the keywords array.`;

    try {
      const response = await aiService.generateJSON<{ keywords: GeneratedKeyword[] }>(
        KEYWORD_GENERATION_PROMPT,
        userPrompt
      );

      if (!response.keywords || !Array.isArray(response.keywords)) {
        throw new Error('Invalid AI response: missing keywords array');
      }

      // Validate and filter keywords
      const validKeywords = response.keywords.filter(k => {
        if (!k.keyword || typeof k.keyword !== 'string') return false;
        if (k.keyword.length < 10 || k.keyword.length > 200) return false;
        if (!['informational', 'how-to', 'list'].includes(k.intent)) {
          k.intent = 'informational'; // Default to informational
        }
        return true;
      });

      return validKeywords;

    } catch (error: any) {
      console.error('[KeywordGenerator] AI generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Store generated keywords in the database.
   * Handles duplicates gracefully with skipDuplicates.
   */
  private async storeKeywords(
    nicheId: string,
    keywords: GeneratedKeyword[],
    source: 'AUTO' | 'AUTO_REFILL'
  ): Promise<{ created: number; skipped: number; errors: string[] }> {
    const result = { created: 0, skipped: 0, errors: [] as string[] };

    for (const item of keywords) {
      const keywordText = item.keyword.trim().toLowerCase();
      const slug = generateSlug(keywordText);

      try {
        await prisma.keyword.create({
          data: {
            nicheId,
            keyword: keywordText,
            slug,
            intent: item.intent,
            source: source as KeywordSource,
            status: 'AVAILABLE',
            used: false,
          },
        });
        result.created++;
      } catch (error: any) {
        // Likely duplicate - skip silently
        result.skipped++;
        if (!error.message?.includes('Unique constraint')) {
          result.errors.push(`Failed to create "${keywordText}": ${error.message}`);
        }
      }
    }

    return result;
  }
}

// Singleton instance
export const keywordGeneratorService = new KeywordGeneratorService();
