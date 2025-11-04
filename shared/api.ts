/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */


// Claude Results API
export interface ClaudeResultsRequest {
  user_query: string;
  monitoring_keyword?: string;
  page_type?: 'results' | 'select_location'; // 'results' for 5 items, 'select_location' for 20 items
}

export interface ClaudeResultsResponse {
  text: string; // Strictly formatted numbered list per prompt
  rankingAnalysis?: RankingAnalysisResponse[]; // Ranking analysis for each item
  keywordPosition?: number; // Position where the monitoring keyword was found (1-5)
  monitoringKeyword?: string; // The keyword that was being monitored
  improvementRecommendations?: ImprovementRecommendation[]; // Improvement recommendations if target is below rank #1
}

// Gemini Results API
export interface GeminiResultsRequest {
  user_query: string;
  monitoring_keyword?: string;
  page_type?: 'results' | 'select_location'; // 'results' for 5 items, 'select_location' for 20 items
}

export interface GeminiResultsResponse {
  text: string;
  rankingAnalysis?: RankingAnalysisResponse[]; // Ranking analysis for each item
  keywordPosition?: number; // Position where the monitoring keyword was found (1-5)
  monitoringKeyword?: string; // The keyword that was being monitored
  improvementRecommendations?: ImprovementRecommendation[]; // Improvement recommendations if target is below rank #1
}

// OpenAI Results API
export interface OpenAIResultsRequest {
  user_query: string;
  monitoring_keyword?: string;
  page_type?: 'results' | 'select_location'; // 'results' for 5 items, 'select_location' for 20 items
}

export interface OpenAIResultsResponse {
  text: string;
  rankingAnalysis?: RankingAnalysisResponse[]; // Ranking analysis for each item
  keywordPosition?: number; // Position where the monitoring keyword was found (1-5)
  monitoringKeyword?: string; // The keyword that was being monitored
  improvementRecommendations?: ImprovementRecommendation[]; // Improvement recommendations if target is below rank #1
}

// Perplexity Results API
export interface PerplexityResultsRequest {
  user_query: string;
  monitoring_keyword?: string;
  page_type?: 'results' | 'select_location'; // 'results' for 5 items, 'select_location' for 20 items
}

export interface PerplexityResultsResponse {
  text: string;
  rankingAnalysis?: RankingAnalysisResponse[]; // Ranking analysis for each item
  keywordPosition?: number; // Position where the monitoring keyword was found (1-5)
  monitoringKeyword?: string; // The keyword that was being monitored
  improvementRecommendations?: ImprovementRecommendation[]; // Improvement recommendations if target is below rank #1
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
  major_reviews?: string[];
}

// Improvement Recommendations API
export interface ImprovementRecommendation {
  category: "SEO & Content Strategy" | "Authority & Citation Strategy" | "Brand Strategy" | "Technical Improvements";
  title: string;
  description: string;
  timeframe: "immediate" | "mid-term" | "long-term";
  expectedImpact: string;
}
