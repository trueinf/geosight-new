import type { ClaudeResultsRequest, ClaudeResultsResponse, GeminiResultsRequest, GeminiResultsResponse, OpenAIResultsRequest, OpenAIResultsResponse, PerplexityResultsRequest, PerplexityResultsResponse } from "@shared/api";

export async function fetchClaudeResults(
  userQuery: string,
  monitoringKeyword?: string
): Promise<string> {
  const body: ClaudeResultsRequest = {
    user_query: userQuery,
    monitoring_keyword: monitoringKeyword,
  };

  const resp = await fetch("/api/claude/results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(errText || `Request failed: ${resp.status}`);
  }

  const data = (await resp.json()) as ClaudeResultsResponse;
  return data.text;
}

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

  // Normalize and cut off anything after the Keyword line to avoid polluting items
  let normalized = text.replace(/\r\n?/g, "\n").trim();
  // Remove surrounding quotes or code fences
  normalized = normalized.replace(/^"+|"+$/g, "");
  normalized = normalized.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ""));
  // Strip markdown bold/italics markers for simpler parsing
  normalized = normalized.replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, "$1");
  const keywordIdx = normalized.search(/^\s*Keyword\s/i);
  const mainSection = keywordIdx >= 0 ? normalized.slice(0, keywordIdx).trim() : normalized;
  // Capture a global Reasons Panel to use as a fallback per item
  const globalReasonsMatch = normalized.match(/Reasons Panel:\s*([\s\S]*?)(?:\n\s*Summary|\n\s*Keyword|$)/i);
  const globalReasons = globalReasonsMatch?.[1]?.trim();

  // Strategy 1: extract full multi-line blocks per item: supports "1. " or "1) "
  let blockMatches = Array.from(
    mainSection.matchAll(/^\s*([1-5])[\.)]\s+([\s\S]*?)(?=^\s*[1-5][\.)]\s|$)/gms)
  );
  
  // If no blocks found, try alternative format (single line items)
  if (blockMatches.length === 0) {
    blockMatches = Array.from(
      mainSection.matchAll(/^\s*([1-5])[\.)]\s+([^\n]+)/gm)
    );
  }
  
  let items: ParsedResultItem[] = blockMatches.map((m) => {
    const rank = Number(m[1]);
    const block = (m[2] || "").trim();
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const firstLine = lines[0] || "";
    let title = firstLine.replace(/^(?:a\)|Result:|Title:)\s*/i, "").trim();

    // Debug logging
    console.log(`Provider: ${text.includes('**Title:') ? 'openai' : text.includes('Adidas') ? 'perplexity' : 'unknown'}`);
    console.log(`Full Block:`, block);
    console.log(`Block: ${block.substring(0, 200)}...`);
    
    // Try multiple patterns to handle different provider formats
    const descMatch = block.match(/(?:\*\*)?Description(?:\*\*)?:\s*([\s\S]*?)(?=\n\s*(?:\*\*)?(?:Rating|Price|Website)(?:\*\*)?:|$)/i) ||
                     block.match(/Description:\s*([\s\S]*?)(?=\n\s*(?:Rating|Price|Website):|$)/i);
    
    const ratingMatch = block.match(/(?:\*\*)?Rating(?:\*\*)?:\s*(\d(?:\.\d+)?)\s*(?:\/\s*5|out of\s*5)/i) ||
                       block.match(/Rating:\s*(\d(?:\.\d+)?)\s*(?:\/\s*5|out of\s*5)/i);
    
    const priceMatch = block.match(/(?:\*\*)?Price(?:\*\*)?:\s*(\$\s?\d+)/i) ||
                      block.match(/Price:\s*(\$\s?\d+)/i);
    
    const siteMatch = block.match(/(?:\*\*)?Website(?:\*\*)?:\s*(\S+)/i) ||
                     block.match(/Website:\s*(\S+)/i);
    
    console.log(`Description: ${descMatch?.[1]?.trim() || 'N/A'}`);
    console.log(`Price: ${priceMatch?.[1] || 'N/A'}`);
    console.log(`Rating: ${ratingMatch?.[1] || 'N/A'}`);
    console.log('---------------------------');
  
    const whyMatch = block.match(/(?:Why this position|Why|Reason):\s*([\s\S]*?)(?:\n|$)/i);

    // If Description: not provided, also allow inline text after Title:
    // Supports escaped colon in titles (e.g., "Nike 39\: Special Edition")
    let inlineAfterTitle = "";
    const titleLine = lines[0] || "";
    if (/^Title:/i.test(titleLine)) {
      const rawAfter = titleLine.replace(/^Title:\s*/i, "");
      const protectedColons = rawAfter.replace(/\\:/g, "__ESC_COLON__");
      const firstColonIdx = protectedColons.indexOf(":");
      if (firstColonIdx >= 0) {
        const t = protectedColons.slice(0, firstColonIdx).replace(/__ESC_COLON__/g, ":").trim();
        const rest = protectedColons.slice(firstColonIdx + 1).replace(/__ESC_COLON__/g, ":").trim();
        if (t) title = t;
        inlineAfterTitle = rest;
      } else {
        title = rawAfter.replace(/\\:/g, ":").trim();
      }
    }
    let description = (descMatch?.[1] || inlineAfterTitle || lines.slice(1).join(" ")).trim();
    description = description.replace(/\bReasons? Panel[\s\S]*$/i, "").trim();

    const rating = ratingMatch ? `${Number(ratingMatch[1]).toFixed(1)}/5` : undefined;

    const priceRange = priceMatch?.[1];

    // Try to find a domain
    const website = siteMatch?.[1]?.toLowerCase();

    // Per-item reason keywords
    const why = (whyMatch?.[1] || globalReasons || "").trim();

    // Simple category inference from description keywords
    const lower = `${title} ${description}`.toLowerCase();
    let category: string | undefined;
    if (/stability|motion control|overpronation/.test(lower)) category = "Stability";
    else if (/support/.test(lower)) category = "Support";
    else if (/neutral/.test(lower)) category = "Neutral";

    return { rank, title: title || `Result #${rank}`, description: description.slice(0, 400), rating, priceRange, website, category, why };
  });

  // Strategy 2: single-line compact list like: "1. A 2. B 3. C ..."
  if (items.length === 0) {
    const compactMatches = Array.from(mainSection.matchAll(/\b([1-5])[\.)]\s+(.+?)(?=\s+[1-5][\.)]\s|$)/g));
    items = compactMatches.map((m) => {
      const rank = Number(m[1]);
      let title = (m[2] || "").trim();
      // De-duplicate repeated numbering like "1. iPhone\n1. iPhone"
      title = title.replace(/^\d+\.\s+/, "").trim();
      // Try grab rating and price inline
      const ratingMatch = title.match(/(\d(?:\.\d+)?)\s*(?:\/\s*5|out of\s*5)/i);
      const rating = ratingMatch ? `${Number(ratingMatch[1]).toFixed(1)}/5` : undefined;
      const priceMatch = title.match(/\$\s?\d{2,4}(?:\s*[\-–—]\s*\$?\s?\d{2,4})?/);
      const priceRange = priceMatch?.[0];
      const siteMatch = title.match(/\b([a-z0-9-]+\.[a-z]{2,})(?:\/[\w\-.]*)?/i);
      const website = siteMatch?.[1]?.toLowerCase();
      return { rank, title: title || `Result #${rank}`, description: "", rating, priceRange, website, why: globalReasons };
    });
  }

  // Strategy 3: split by explicit Title: blocks when numbering is missing
  if (items.length === 0) {
    const titleBlocks = mainSection.split(/(?:^|\n)\s*Title:\s*/i).filter(Boolean);
    if (titleBlocks.length > 0) {
      items = titleBlocks.slice(0, 5).map((blk, idx) => {
        const titleLine = blk.split(/\n|Description:/i)[0].trim();
        const block = `Title: ${blk}`;
        const descMatch = block.match(/Description:\s*([\s\S]*?)(?:\n|Rating:|Price:|Website:|$)/i);
        const ratingMatch = block.match(/Rating:\s*(\d(?:\.\d+)?)\s*(?:\/\s*5|out of\s*5)/i);
        const priceMatch = block.match(/Price:\s*(\$\s?\d{2,4}(?:\s*[\-–—]\s*\$?\s?\d{2,4})?)/i);
        const siteMatch = block.match(/Website:\s*(\S+)/i);
        return {
          rank: idx + 1,
          title: titleLine || `Result #${idx + 1}`,
          description: (descMatch?.[1] || "").trim().slice(0, 400),
          rating: ratingMatch ? `${Number(ratingMatch[1]).toFixed(1)}/5` : undefined,
          priceRange: priceMatch?.[1],
          website: siteMatch?.[1]?.toLowerCase(),
        } as ParsedResultItem;
      });
    }
  }

  // Fallback: if still empty but we have text, return a single generic item
  if (items.length === 0 && mainSection) {
    items = [{ rank: 1, title: "Top Results", description: mainSection.slice(0, 400), why: globalReasons }];
  }

  // Sort by rank and limit to top 5
  items.sort((a, b) => a.rank - b.rank);
  return items.slice(0, 5);
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
      return fetchClaudeResults(query, keyword);
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
  } as any;
  results.forEach(([p, items]) => { (map as any)[p] = items; });
  return map;
}


