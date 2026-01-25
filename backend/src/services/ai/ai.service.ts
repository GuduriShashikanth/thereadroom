import OpenAI from 'openai';
import { AIServiceInterface, GenerationOptions, AICompletionResponse } from './ai.interface';
import { config } from '../../config';

/**
 * Concrete implementation of AIService using OpenAI-compatible API
 * This allows swapping between OpenAI, Groq, DeepInfra, LocalLLM (Ollama), etc.
 */
export class AIService implements AIServiceInterface {
  private client: OpenAI;
  private model: string;
  private isInitialized: boolean = false;

  constructor() {
    this.model = config.openai.model;
    console.log('🤖 [AIService] Initialized with Model:', this.model, 'BaseURL:', config.openai.baseUrl);
    
    // Initialize OpenAI client with flexible configuration
    // This works with any provider that supports the OpenAI SDK
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
      baseURL: config.openai.baseUrl,
      dangerouslyAllowBrowser: false,
    });
    
    this.isInitialized = true;
  }

  /**
   * Check if the AI provider is reachable
   */
  async checkHealth(): Promise<boolean> {
    try {
      // Simple lightweight call to verify connection
      // We use a comprehensive list models call which is standard
      await this.client.models.list();
      return true;
    } catch (error) {
      console.error('AI Service health check failed:', error);
      return false;
    }
  }

  /**
   * Generate text completion
   */
  async generateCompletion(
    systemPrompt: string,
    userPrompt: string,
    options?: GenerationOptions
  ): Promise<AICompletionResponse> {
    try {
      if (!this.isInitialized) throw new Error('AI Service not initialized');

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
      });

      const choice = completion.choices[0];
      
      if (!choice || !choice.message || !choice.message.content) {
        throw new Error('Empty response from AI provider');
      }

      return {
        text: choice.message.content || '',
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        } : undefined,
      };

    } catch (error) {
      console.error('AI Generation Error:', error);
      // Re-throw with clean message
      if (error instanceof Error) {
        throw new Error(`AI Generation Failed: ${error.message}`);
      }
      throw new Error('AI Generation Failed: Unknown error');
    }
  }

  /**
   * Generate structured JSON outputs with validation attempt
   * @param systemPrompt - Instruction should enforce JSON format
   * @param userPrompt - User request
   */
  async generateJSON<T>(systemPrompt: string, userPrompt: string): Promise<T> {
    // Append JSON instruction to guarantee format if model is weak
    const jsonInstruction = systemPrompt.includes('JSON') 
      ? systemPrompt 
      : `${systemPrompt}\n\nIMPORTANT: Output valid JSON only.`;

    const response = await this.generateCompletion(jsonInstruction, userPrompt, {
      temperature: 0.3, // Lower config for deterministic structure
      jsonMode: true,   // Hint to provider to enforce JSON mode if supported
    });

    try {
      const parsed = JSON.parse(response.text);
      return parsed as T;
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', response.text);
      throw new Error('AI response was not valid JSON');
    }
  }
}

// Singleton instance for easy import
export const aiService = new AIService();
