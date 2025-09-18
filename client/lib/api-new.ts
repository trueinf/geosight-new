import type { ClaudeResultsRequest, ClaudeResultsResponse, GeminiResultsRequest, GeminiResultsResponse, OpenAIResultsRequest, OpenAIResultsResponse, PerplexityResultsRequest, PerplexityResultsResponse } from "@shared/api";

export interface ParsedResultItem {
  rank: number;
  title: string;
  description: string;
  rating?: string; // e.g., 4.7/5
  priceRange?: string; // e.g., $140 - $160
  website?: string; // e.g., asics.com
  category?: string; // e.g., Stability / Support / Neutral
  why?: string; // brief reason for position
}

export function parseStrictListResponse(text: string): ParsedResultItem[] {
  if (!text) return [];

  console.log("=== PARSING RAW TEXT ===");
  console.log("Raw text:", text);
  console.log("========================");

  // Try to find numbered items in the text
  const items: ParsedResultItem[] = [];
  
  // Look for patterns like "1. Title: ..." or "1) Title: ..."
  const itemMatches = text.matchAll(/(\d+)[\.)]\s*([\s\S]*?)(?=\n\s*\d+[\.)]\s|$)/g);
  
  for (const match of itemMatches) {
    const rank = parseInt(match[1]);
    if (rank > 5) break; // Only process first 5 items
    
    const content = match[2].trim();
    console.log(`\n--- Processing item ${rank} ---`);
    console.log("Content:", content);
    
    // Extract title (first line or after "Title:")
    let title = content.split('\n')[0].trim();
    if (title.startsWith('Title:')) {
      title = title.replace(/^Title:\s*/i, '').trim();
    }
    
    // Extract description
    const descMatch = content.match(/Description:\s*([\s\S]*?)(?=\n\s*(?:Rating|Price|Website):|$)/i);
    const description = descMatch?.[1]?.trim() || '';
    
    // Extract rating
    const ratingMatch = content.match(/Rating:\s*(\d(?:\.\d+)?)\s*(?:\/\s*5|out of\s*5)/i);
    const rating = ratingMatch ? `${Number(ratingMatch[1]).toFixed(1)}/5` : undefined;
    
    // Extract price
    const priceMatch = content.match(/Price:\s*(\$\s?\d+)/i);
    const priceRange = priceMatch?.[1];
    
    // Extract website
    const siteMatch = content.match(/Website:\s*(\S+)/i);
    const website = siteMatch?.[1]?.toLowerCase();
    
    console.log("Extracted:");
    console.log("- Title:", title);
    console.log("- Description:", description);
    console.log("- Rating:", rating);
    console.log("- Price:", priceRange);
    console.log("- Website:", website);
    
    items.push({
      rank,
      title,
      description: description || undefined,
      rating,
      priceRange,
      website,
      why: undefined, // Will be filled later if needed
    });
  }
  
  console.log(`\n=== PARSED ${items.length} ITEMS ===`);
  return items;
}

export async function fetchClaudeResults(userQuery: string, monitoringKeyword: string): Promise<string> {
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
  return data.text;
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

export type ProviderKey = "claude" | "gemini" | "openai" | "perplexity";

export async function fetchProviderResults(provider: ProviderKey, query: string, keyword?: string): Promise<string> {
  switch (provider) {
    case "claude":
      return fetchClaudeResults(query, keyword);
    case "gemini":
      return fetchGeminiResults(query, keyword);
    case "openai":
      return fetchOpenAIResults(query, keyword);
    case "perplexity":
      return fetchPerplexityResults(query, keyword);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export async function fetchAllProviderItems(
  query: string,
  keyword?: string
): Promise<Record<ProviderKey, ParsedResultItem[]>> {
  const providers: ProviderKey[] = ["claude", "openai", "perplexity", "gemini"];
  const results = await Promise.all(
    providers.map(async (p) => {
      try {
        const text = await fetchProviderResults(p, query, keyword);
        console.log(`Raw text from ${p}:`, text); // Inspect the actual response text here

        const items = parseStrictListResponse(text);
        items.forEach(item => {
          console.log(`Provider: ${p}`);
          console.log("Description:", item.description);
          console.log("Price:", item.priceRange || "N/A");
          console.log("Rating:", item.rating || "N/A");
          console.log("---------------------------");
        });

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
