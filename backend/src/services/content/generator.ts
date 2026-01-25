import { aiService } from '../ai/ai.service';
import { ContentGeneratorInterface, ArticleGeneratedPayload } from './interface';
import { SEO_SYSTEM_PROMPT, generateUserPrompt } from './prompts';
import { generateSlug } from '../../utils/slug';

export class ContentGenerator implements ContentGeneratorInterface {
  
  /**
   * Generate a complete SEO article for a given niche and keyword
    */
  async generateArticle(niche: string, keyword: string): Promise<ArticleGeneratedPayload> {
    console.log(`🧠 [Generator] Starting generation for: "${keyword}" in "${niche}"`);

    const userPrompt = generateUserPrompt(niche, keyword);

    // 1. Call AI Service with JSON enforcement
    // We expect the AI service to handle the raw HTTP call and JSON parsing
    const rawData = await aiService.generateJSON<ArticleGeneratedPayload>(
      SEO_SYSTEM_PROMPT,
      userPrompt
    );

    // 2. Validate and Clean Output
    if (!rawData.content || !rawData.title) {
      throw new Error('AI generated incomplete content payload');
    }

    // 3. Post-processing
    // Ensure slug is actually URL-safe even if AI suggests one
    const cleanSlug = generateSlug(rawData.slug || rawData.title);

    // Ensure content has proper structure (basic check)
    if (rawData.content.length < 100) {
      throw new Error('AI generated content too short');
    }

    console.log(`✅ [Generator] Successfully generated "${rawData.title}"`);

    return {
      ...rawData,
      slug: cleanSlug,
    };
  }
}

export const contentGenerator = new ContentGenerator();
