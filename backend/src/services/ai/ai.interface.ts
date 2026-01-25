/**
 * AI Service Interface
 * Defines the contract for AI/LLM interactions to ensure provider neutrality.
 */

export interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface AICompletionResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIServiceInterface {
  /**
   * Check if the AI service is configured and reachable
   */
  checkHealth(): Promise<boolean>;

  /**
   * Generate text completion based on a prompt
   * @param systemPrompt - The system instruction (context, persona, constraints)
   * @param userPrompt - The specific user request
   * @param options - Configuration options
   */
  generateCompletion(
    systemPrompt: string, 
    userPrompt: string, 
    options?: GenerationOptions
  ): Promise<AICompletionResponse>;

  /**
   * Generate a structured JSON response
   * @param systemPrompt - System instruction enforcing JSON output
   * @param userPrompt - User request
   * @param schema - Optional JSON schema to guide the output (if supported)
   */
  generateJSON<T>(
    systemPrompt: string, 
    userPrompt: string
  ): Promise<T>;
}
