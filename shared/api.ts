/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// Claude Results API
export interface ClaudeResultsRequest {
  user_query: string;
  monitoring_keyword?: string;
}

export interface ClaudeResultsResponse {
  text: string; // Strictly formatted numbered list per prompt
}

// Gemini Results API
export interface GeminiResultsRequest {
  user_query: string;
  monitoring_keyword?: string;
}

export interface GeminiResultsResponse {
  text: string;
}

// OpenAI Results API
export interface OpenAIResultsRequest {
  user_query: string;
  monitoring_keyword?: string;
}

export interface OpenAIResultsResponse {
  text: string;
}

// Perplexity Results API
export interface PerplexityResultsRequest {
  user_query: string;
  monitoring_keyword?: string;
}

export interface PerplexityResultsResponse {
  text: string;
}
