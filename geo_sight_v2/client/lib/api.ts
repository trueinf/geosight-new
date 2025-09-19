import type { ClaudeResultsRequest, ClaudeResultsResponse, GeminiResultsRequest, GeminiResultsResponse, OpenAIResultsRequest, OpenAIResultsResponse, PerplexityResultsRequest, PerplexityResultsResponse, RankingAnalysisRequest, RankingAnalysisResponse } from "@shared/api";

// Re-export for use in components
export type { RankingAnalysisResponse } from "@shared/api";

export interface ParsedResultItem {
  rank: number;
  title: string;
  description: string;
  rating?: string; // e.g., 4.7/5
  priceRange?: string; // e.g., $140 - $160
  website?: string; // e.g., asics.com
  category?: string; // e.g., Stability / Support / Neutral
  why?: string; // brief reason for position
  rankingAnalysis?: RankingAnalysisResponse; // detailed ranking analysis
}

export function parseStrictListResponse(text: string, rankingAnalysis?: RankingAnalysisResponse[]): ParsedResultItem[] {
  if (!text) return [];
  
  console.log('🔍 RAW TEXT FROM API:', text);
  console.log('🔍 RANKING ANALYSIS FROM API:', rankingAnalysis);


  // Try to find numbered items in the text
  const items: ParsedResultItem[] = [];
  
  // Look for patterns like "1. Title: ..." or "1) Title: ..."
  const itemMatches = text.matchAll(/(\d+)[\.)]\s*([\s\S]*?)(?=\n\s*\d+[\.)]\s|$)/g);
  
  for (const match of itemMatches) {
    const rank = parseInt(match[1]);
    if (rank > 5) break; // Only process first 5 items
    
    const content = match[2].trim();
    
    // Extract title (first line or after "Title:")
    let title = content.split('\n')[0].trim();
    if (title.startsWith('Title:')) {
      title = title.replace(/^Title:\s*/i, '').trim();
    }
    
    // Clean up markdown formatting from title
    title = title
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold** markdown
      .replace(/\*([^*]+)\*/g, '$1') // Remove *italic* markdown
      .trim();
    
    // Extract description - handle both "Description:" format and inline format
    let descMatch = content.match(/Description:\s*([\s\S]*?)(?=\n\s*(?:Rating|Price|Website):|$)/i);
    let description = descMatch?.[1]?.trim() || '';
    
    // If no Description: found, try to extract from the content after title
    if (!description) {
      const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 1) {
        // Take the second line as description if it doesn't start with Rating/Price/Website
        const secondLine = lines[1];
        if (!secondLine.match(/^(Rating|Price|Website):/i)) {
          description = secondLine;
        }
      }
    }
    
    // Clean up markdown formatting and common typos
    description = description
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold** markdown
      .replace(/\*([^*]+)\*/g, '$1') // Remove *italic* markdown
      .replace(/\breturr\b/g, 'return')
      .replace(/\bcomin\b/g, 'coming')
      .replace(/\bperfomance\b/g, 'performance')
      .replace(/\bperfom\b/g, 'perform')
      .replace(/\s+$/g, '') // Remove trailing whitespace
      .trim();
    
    // Extract rating - handle both "Rating:" format and inline format
    let ratingMatch = content.match(/Rating:\s*(\d(?:\.\d+)?)\s*(?:\/\s*5|out of\s*5)/i);
    if (!ratingMatch) {
      // Try inline format like "**Rating:** 4.8/5"
      ratingMatch = content.match(/\*\*Rating:\*\*\s*(\d(?:\.\d+)?)\s*(?:\/\s*5|out of\s*5)/i);
    }
    const rating = ratingMatch ? `${Number(ratingMatch[1]).toFixed(1)}/5` : undefined;
    
    // Extract price - handle both "Price:" format and inline format
    let priceMatch = content.match(/Price:\s*(\$\s?\d+)/i);
    if (!priceMatch) {
      // Try inline format like "**Price:** $180"
      priceMatch = content.match(/\*\*Price:\*\*\s*(\$\s?\d+)/i);
    }
    const priceRange = priceMatch?.[1];
    
    // Extract website - handle both "Website:" format and inline format
    let siteMatch = content.match(/Website:\s*(\S+)/i);
    if (!siteMatch) {
      // Try inline format like "**Website:** www.adidas.com"
      siteMatch = content.match(/\*\*Website:\*\*\s*(\S+)/i);
    }
    const website = siteMatch?.[1]?.toLowerCase();
    
    
    // Find matching ranking analysis for this item by rank position
    const matchingAnalysis = rankingAnalysis?.find(analysis => analysis.rank === rank);
    
    console.log(`🔍 PARSED ITEM #${rank}:`, {
      title,
      description,
      rating,
      priceRange,
      website,
      matchingAnalysis,
      availableRanks: rankingAnalysis?.map(a => a.rank)
    });

    items.push({
      rank,
      title,
      description: description || undefined,
      rating,
      priceRange,
      website,
      why: matchingAnalysis?.llm_reasoning || undefined,
      rankingAnalysis: matchingAnalysis,
    });
  }
  
  return items;
}

export async function fetchClaudeResults(userQuery: string, monitoringKeyword: string): Promise<{ text: string; rankingAnalysis?: RankingAnalysisResponse[] }> {
  const body: ClaudeResultsRequest = {
    user_query: userQuery,
    monitoring_keyword: monitoringKeyword,
  };
  const resp = await fetch("/api/claude/results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(await resp.text());
  const data = (await resp.json()) as ClaudeResultsResponse;
  return { text: data.text, rankingAnalysis: data.rankingAnalysis };
}

export async function fetchGeminiResults(
  userQuery: string,
  monitoringKeyword?: string
): Promise<string> {
  const body: GeminiResultsRequest = {
    user_query: userQuery,
    monitoring_keyword: monitoringKeyword,
  };
  const resp = await fetch("/api/gemini/results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(await resp.text());
  const data = (await resp.json()) as GeminiResultsResponse;
  return data.text;
}

export async function fetchOpenAIResults(
  userQuery: string,
  monitoringKeyword?: string
): Promise<string> {
  const body: OpenAIResultsRequest = {
    user_query: userQuery,
    monitoring_keyword: monitoringKeyword,
  };
  const resp = await fetch("/api/openai/results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(await resp.text());
  const data = (await resp.json()) as OpenAIResultsResponse;
  return data.text;
}

export async function fetchPerplexityResults(
  userQuery: string,
  monitoringKeyword?: string
): Promise<string> {
  const body: PerplexityResultsRequest = {
    user_query: userQuery,
    monitoring_keyword: monitoringKeyword,
  };
  const resp = await fetch("/api/perplexity/results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(await resp.text());
  const data = (await resp.json()) as PerplexityResultsResponse;
  return data.text;
}

export async function fetchRankingAnalysis(
  provider: string,
  target: string,
  userQuery: string,
  monitoringKeyword: string,
  resultsText: string
): Promise<RankingAnalysisResponse> {
  const body: RankingAnalysisRequest = {
    provider,
    target,
    user_query: userQuery,
    monitoring_keyword: monitoringKeyword,
    results_text: resultsText,
  };
  const resp = await fetch("/api/ranking-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(await resp.text());
  const data = (await resp.json()) as RankingAnalysisResponse;
  return data;
}

export type ProviderKey = "claude" | "gemini" | "openai" | "perplexity";

export async function fetchProviderResults(provider: ProviderKey, query: string, keyword?: string): Promise<{ text: string; rankingAnalysis?: RankingAnalysisResponse[] }> {
  switch (provider) {
    case "claude":
      return fetchClaudeResults(query, keyword);
    case "gemini":
      return { text: await fetchGeminiResults(query, keyword), rankingAnalysis: undefined };
    case "openai":
      return { text: await fetchOpenAIResults(query, keyword), rankingAnalysis: undefined };
    case "perplexity":
      return { text: await fetchPerplexityResults(query, keyword), rankingAnalysis: undefined };
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export async function fetchAllProviderItems(
  query: string,
  keyword?: string
): Promise<Record<ProviderKey, ParsedResultItem[]>> {
  const providers: ProviderKey[] = ["claude", "openai", "gemini"]; // Temporarily removed perplexity due to 401 error
  
  // Use parallel calls with staggered start times to prevent rate limiting
  const results = await Promise.all(
    providers.map(async (p, index) => {
      // Stagger the start times slightly to avoid simultaneous requests
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, 100 * index)); // 100ms, 200ms delays
      }
      
      try {
        const result = await fetchProviderResults(p, query, keyword);
        console.log(`🔍 PROVIDER ${p} RESULT:`, {
          textLength: result.text.length,
          rankingAnalysis: result.rankingAnalysis
        });
        const items = parseStrictListResponse(result.text, result.rankingAnalysis);
        return [p, items] as const;
      } catch (err) {
        console.error(`Failed to fetch from ${p}:`, err);
        return [p, [] as ParsedResultItem[]] as const;
      }
    })
  );
  const map: Record<ProviderKey, ParsedResultItem[]> = {
    claude: [], openai: [], perplexity: [], gemini: []
  };
  results.forEach(([p, items]) => { map[p] = items; });
  return map;
}
