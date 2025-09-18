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
  rankingAnalysis?: RankingAnalysisResponse[]; // Ranking analysis for each item
}

// Gemini Results API
export interface GeminiResultsRequest {
  user_query: string;
  monitoring_keyword?: string;
}

export interface GeminiResultsResponse {
  text: string;
  rankingAnalysis?: RankingAnalysisResponse[]; // Ranking analysis for each item
}

// OpenAI Results API
export interface OpenAIResultsRequest {
  user_query: string;
  monitoring_keyword?: string;
}

export interface OpenAIResultsResponse {
  text: string;
  rankingAnalysis?: RankingAnalysisResponse[]; // Ranking analysis for each item
}

// Perplexity Results API
export interface PerplexityResultsRequest {
  user_query: string;
  monitoring_keyword?: string;
}

export interface PerplexityResultsResponse {
  text: string;
  rankingAnalysis?: RankingAnalysisResponse[]; // Ranking analysis for each item
}

// Ranking Analysis API
export interface RankingAnalysisRequest {
  provider: string;
  target: string;
  user_query: string;
  monitoring_keyword: string;
  results_text: string;
}

export interface RankingAnalysisResponse {
  provider: string;
  target: string;
  rank: number | null;
  matched_keywords: string[];
  contextual_signals: string[];
  competitor_presence: string[];
  sentiment: "positive" | "neutral" | "negative";
  citation_domains: string[];
  llm_reasoning: string;
}
