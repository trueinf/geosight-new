import type { ClaudeResultsRequest, ClaudeResultsResponse, GeminiResultsRequest, GeminiResultsResponse, OpenAIResultsRequest, OpenAIResultsResponse, PerplexityResultsRequest, PerplexityResultsResponse, RankingAnalysisRequest, RankingAnalysisResponse, ImprovementRecommendation } from "@shared/api";

// Re-export for use in components
export type { RankingAnalysisResponse, ImprovementRecommendation } from "@shared/api";

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
  isHilton?: boolean; // true if Hilton or Hilton-owned property
  // New fields for target-centric analysis
  keywords?: string[]; // relevant keywords found
  authority?: number; // authority score 0-1
  context?: string; // contextual information
  citations?: string[]; // source domains/citations
}

export function parseStrictListResponse(text: string, rankingAnalysis?: RankingAnalysisResponse[], maxItems: number = 10): ParsedResultItem[] {
  console.log('🔍 PARSE FUNCTION CALLED:');
  console.log('🔍 TEXT LENGTH:', text?.length || 0);
  console.log('🔍 TEXT IS EMPTY:', !text || text.trim().length === 0);
  console.log('🔍 RANKING ANALYSIS LENGTH:', rankingAnalysis?.length || 0);
  console.log('🔍 MAX ITEMS:', maxItems);
  
  if (!text || text.trim().length === 0) {
    console.log('🔍 TEXT IS EMPTY - checking if we have rankingAnalysis');
    if (rankingAnalysis && rankingAnalysis.length > 0) {
      console.log('🔍 HAVE RANKING ANALYSIS - proceeding with fallback logic');
      // Continue with the parsing logic below
    } else {
      console.log('🔍 NO RANKING ANALYSIS EITHER - returning empty array');
      return [];
    }
  }
  
  console.log('🔍 RAW TEXT FROM API:', text);
  console.log('🔍 RANKING ANALYSIS FROM API:', rankingAnalysis);
  console.log('🔍 RANKING ANALYSIS TYPE:', typeof rankingAnalysis);
  console.log('🔍 RANKING ANALYSIS LENGTH:', rankingAnalysis?.length);
  console.log('🔍 RANKING ANALYSIS RANKS:', rankingAnalysis?.map(a => a.rank));
  console.log('🔍 MAX ITEMS TO PARSE:', maxItems);
  console.log('🔍 FIRST 500 CHARS OF TEXT:', text.substring(0, 500));
  
  // Try to find numbered items in the text
  const items: ParsedResultItem[] = [];
  
  // Exclude "Ranking Analysis" and "Improvement Recommendations" sections from parsing
  let textToParse = text || '';
  const rankingAnalysisIndex = textToParse.indexOf('### Ranking Analysis');
  const improvementIndex = textToParse.indexOf('### Improvement Recommendations');
  const stopIndex = Math.min(
    rankingAnalysisIndex > -1 ? rankingAnalysisIndex : textToParse.length,
    improvementIndex > -1 ? improvementIndex : textToParse.length
  );
  if (stopIndex < textToParse.length) {
    textToParse = textToParse.substring(0, stopIndex);
    console.log('🔍 EXCLUDING RANKING ANALYSIS SECTION, parsing text up to index:', stopIndex);
  }
  
  // Look for patterns like "1. Title: ..." or "1) Title: ..."
  // Updated regex to better handle multiline content
  let allMatches: RegExpExecArray[] = [];
  
  if (textToParse && textToParse.length > 0) {
    const itemMatches = textToParse.matchAll(/(\d+)[\.)]\s*([\s\S]*?)(?=\n\s*\d+[\.)]\s|$)/g);
    allMatches = Array.from(itemMatches);
    console.log('🔍 FOUND ITEM MATCHES:', allMatches.length, allMatches.map(m => m[1]));
  } else {
    console.log('🔍 NO TEXT TO PARSE - will rely on rankingAnalysis only');
  }
  
  console.log('🔍 RAW TEXT PREVIEW:', text?.substring(0, 1000) || 'EMPTY');
  console.log('🔍 FULL TEXT LENGTH:', text?.length || 0);
  console.log('🔍 TEXT TO PARSE LENGTH:', textToParse.length);
  console.log('🔍 WILL PROCESS UP TO RANK:', maxItems);
  
  // If no matches found, try alternative patterns
  if (allMatches.length === 0 && textToParse && textToParse.length > 0) {
    console.log('🔍 No matches found with standard pattern, trying alternative patterns...');
    
    // Try pattern without lookahead - more permissive
    const altMatches = textToParse.matchAll(/(\d+)[\.)]\s*([\s\S]*?)(?=\n\s*\d+[\.)]|$)/g);
    const altMatchesArray = Array.from(altMatches);
    console.log('🔍 ALTERNATIVE PATTERN MATCHES:', altMatchesArray.length, altMatchesArray.map(m => m[1]));
    
    if (altMatchesArray.length > 0) {
      allMatches = altMatchesArray; // Replace instead of adding to avoid duplicates
    } else {
      // Try even more permissive pattern - split by numbered items
      console.log('🔍 Trying split-based approach...');
      const lines = textToParse.split('\n');
      const splitMatches: RegExpMatchArray[] = [];
      let currentItem = '';
      let currentRank = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const rankMatch = line.match(/^(\d+)[\.)]\s*(.*)/);
        
        if (rankMatch) {
          // Save previous item if exists
          if (currentRank > 0 && currentItem.trim()) {
            splitMatches.push([`${currentRank}.`, currentItem.trim()] as RegExpMatchArray);
          }
          // Start new item
          currentRank = parseInt(rankMatch[1]);
          currentItem = rankMatch[2] + '\n';
        } else if (currentRank > 0) {
          // Continue current item
          currentItem += line + '\n';
        }
      }
      
      // Add the last item
      if (currentRank > 0 && currentItem.trim()) {
        splitMatches.push([`${currentRank}.`, currentItem.trim()] as RegExpMatchArray);
      }
      
      console.log('🔍 SPLIT-BASED MATCHES:', splitMatches.length, splitMatches.map(m => m[0]));
      if (splitMatches.length > 0) {
        allMatches = splitMatches as RegExpExecArray[];
      }
    }
  }
  
  // If we have rankingAnalysis data, use it directly and extract descriptions from text
  if (rankingAnalysis && rankingAnalysis.length > 0) {
    console.log('🔍 Using rankingAnalysis data directly with text descriptions');
    console.log('🔍 rankingAnalysis items:', rankingAnalysis.length);
    console.log('🔍 text matches found:', allMatches.length);
    console.log('🔍 text length:', text.length);
    console.log('🔍 text is empty or very short:', text.length < 100);
    
    // First, parse the text to extract descriptions by hotel name
    const textDescriptions: Record<string, string> = {};
    
    if (allMatches.length > 0) {
      for (const match of allMatches) {
        const rank = parseInt(match[1]);
        const content = match[2].trim();
        
        console.log(`🔍 Processing text match #${rank}:`, content.substring(0, 100));
        
        // Extract hotel name and description from text
        const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length > 0) {
          const firstLine = lines[0];
          // Extract hotel name (remove rank prefix if present)
          let hotelName = firstLine.replace(/^\d+\.\s*/, '').trim();
          
          // Handle "Title: Hotel Name" format
          if (hotelName.startsWith('Title:')) {
            hotelName = hotelName.replace(/^Title:\s*/, '').trim();
          }
        
          // Extract description from second line or Description: field
          let description = '';
          if (lines.length > 1) {
            const secondLine = lines[1];
            if (!secondLine.match(/^(Rating|Price|Website):/i)) {
              description = secondLine;
            }
          }
          
          // Try to find Description: field
          if (!description) {
            const descMatch = content.match(/Description:\s*([\s\S]*?)(?=\n\s*(?:Rating|Price|Website):|$)/i);
            description = descMatch?.[1]?.trim() || '';
          }
          
          // Clean up markdown formatting
          description = description
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1')
            .trim();
          
          if (description && hotelName) {
            textDescriptions[hotelName.toLowerCase()] = description;
            console.log(`🔍 Found description for ${hotelName}: ${description}`);
          }
        }
      }
    } else {
      console.log('🔍 No text matches found - will use fallback descriptions');
    }
    
    console.log('🔍 Total descriptions extracted:', Object.keys(textDescriptions).length);
    
    // Handle both hotel queries (20 items) and general queries (5 items)
    if (maxItems === 20) {
      // Group rankingAnalysis items by category and limit to 5 per category
      // Since ranks repeat (1-5 for each category), we need to group by position in the array
      const categoryGroups: Record<string, any[]> = {
        "Best Hotels": [],
        "Best Luxury Hotels": [],
        "Best Business Hotels": [],
        "Best Family Hotels": []
      };
      
      // Group by position: 0-4 (Best Hotels), 5-9 (Luxury), 10-14 (Business), 15-19 (Family)
      for (let i = 0; i < rankingAnalysis.length; i++) {
        const analysis = rankingAnalysis[i];
        let category = "Best Hotels";
        
        if (i >= 0 && i <= 4) {
          category = "Best Hotels";
        } else if (i >= 5 && i <= 9) {
          category = "Best Luxury Hotels";
        } else if (i >= 10 && i <= 14) {
          category = "Best Business Hotels";
        } else if (i >= 15 && i <= 19) {
          category = "Best Family Hotels";
        }
        
        // Only add if category has less than 5 items
        if (categoryGroups[category].length < 5) {
          categoryGroups[category].push(analysis);
          console.log(`🔍 Added ${analysis.target} to ${category} (rank ${analysis.rank}, position ${i})`);
        } else {
          console.log(`🔍 Skipped ${analysis.target} - ${category} already has 5 items`);
        }
      }
      
      // Now process the limited items with descriptions from text
      for (const categoryItems of Object.values(categoryGroups)) {
        for (const analysis of categoryItems) {
          // If text is empty or very short, use a default description based on the target
          let description = textDescriptions[analysis.target.toLowerCase()];
          
          if (!description || description.length < 10) {
            // Create a meaningful description from the target name and reasoning
            const targetWords = analysis.target.split(' - ');
            const companyName = targetWords[0] || analysis.target;
            const shipName = targetWords[1] || '';
            
            // Detect query type from target name or context
            const isCruise = analysis.target.toLowerCase().includes('cruise') || 
                            analysis.target.toLowerCase().includes('caribbean') ||
                            analysis.target.toLowerCase().includes('royal caribbean') ||
                            analysis.target.toLowerCase().includes('carnival') ||
                            analysis.target.toLowerCase().includes('norwegian') ||
                            analysis.target.toLowerCase().includes('princess') ||
                            analysis.target.toLowerCase().includes('disney');
            
            const isHotel = analysis.target.toLowerCase().includes('hotel') ||
                           analysis.target.toLowerCase().includes('hilton') ||
                           analysis.target.toLowerCase().includes('marriott') ||
                           analysis.target.toLowerCase().includes('hyatt') ||
                           analysis.target.toLowerCase().includes('plaza') ||
                           analysis.target.toLowerCase().includes('house') ||
                           analysis.target.toLowerCase().includes('gateshead') ||
                           analysis.target.toLowerCase().includes('newcastle');
            
            if (isCruise || shipName) {
              description = `${companyName}'s ${shipName} offers exceptional cruise experiences with modern amenities, diverse dining options, and exciting entertainment. Perfect for travelers seeking memorable Caribbean adventures.`;
            } else if (isHotel) {
              description = `${analysis.target} provides excellent accommodation with modern amenities, comfortable rooms, and exceptional service. Perfect for business and leisure travelers seeking quality hospitality.`;
            } else {
              description = `${analysis.target} provides outstanding services with premium quality, excellent customer service, and competitive offerings.`;
            }
            
            console.log(`🔍 Generated fallback description for ${analysis.target}: ${description.substring(0, 100)}...`);
          }
          
          console.log(`🔍 Creating item: ${analysis.target} - Description: ${description.substring(0, 100)}...`);
          
          const item = {
            rank: analysis.rank,
            title: analysis.target,
            description: description,
            rating: undefined,
            priceRange: undefined,
            website: analysis.citation_domains?.[0] || undefined,
            isHilton: analysis.target.toLowerCase().includes('hilton'),
            why: analysis.llm_reasoning || undefined,
            rankingAnalysis: analysis,
          };
          items.push(item);
        }
      }
    } else {
      // For general queries (5 items), process all ranking analysis items directly
      for (const analysis of rankingAnalysis) {
        // If text is empty or very short, use a default description based on the target
        let description = textDescriptions[analysis.target.toLowerCase()];
        
        if (!description || description.length < 10) {
          // Create a meaningful description from the target name and reasoning
          const targetWords = analysis.target.split(' - ');
          const companyName = targetWords[0] || analysis.target;
          const shipName = targetWords[1] || '';
          
          // Detect query type from target name or context
          const isCruise = analysis.target.toLowerCase().includes('cruise') || 
                          analysis.target.toLowerCase().includes('caribbean') ||
                          analysis.target.toLowerCase().includes('royal caribbean') ||
                          analysis.target.toLowerCase().includes('carnival') ||
                          analysis.target.toLowerCase().includes('norwegian') ||
                          analysis.target.toLowerCase().includes('princess') ||
                          analysis.target.toLowerCase().includes('disney');
          
          const isHotel = analysis.target.toLowerCase().includes('hotel') ||
                         analysis.target.toLowerCase().includes('hilton') ||
                         analysis.target.toLowerCase().includes('marriott') ||
                         analysis.target.toLowerCase().includes('hyatt') ||
                         analysis.target.toLowerCase().includes('plaza') ||
                         analysis.target.toLowerCase().includes('house') ||
                         analysis.target.toLowerCase().includes('gateshead') ||
                         analysis.target.toLowerCase().includes('newcastle');
          
          if (isCruise || shipName) {
            description = `${companyName}'s ${shipName} offers exceptional cruise experiences with modern amenities, diverse dining options, and exciting entertainment. Perfect for travelers seeking memorable Caribbean adventures.`;
          } else if (isHotel) {
            description = `${analysis.target} provides excellent accommodation with modern amenities, comfortable rooms, and exceptional service. Perfect for business and leisure travelers seeking quality hospitality.`;
          } else {
            description = `${analysis.target} provides outstanding services with premium quality, excellent customer service, and competitive offerings.`;
          }
          
          console.log(`🔍 Generated fallback description for ${analysis.target}: ${description.substring(0, 100)}...`);
        }
        
        console.log(`🔍 Creating item: ${analysis.target} - Description: ${description.substring(0, 100)}...`);
        
        const item = {
          rank: analysis.rank,
          title: analysis.target,
          description: description,
          rating: undefined,
          priceRange: undefined,
          website: analysis.citation_domains?.[0] || undefined,
          isHilton: analysis.target.toLowerCase().includes('hilton'),
          why: analysis.llm_reasoning || undefined,
          rankingAnalysis: analysis,
        };
        items.push(item);
      }
    }
    
    console.log(`🔍 Final items created: ${items.length}`);
    return items;
  }

  // Fallback to text parsing if no rankingAnalysis data
  for (const match of allMatches) {
    const rank = parseInt(match[1]);
    console.log(`🔍 PROCESSING ITEM #${rank}:`, match[2].substring(0, 200));
    
    if (rank > maxItems) {
      break;
    }
    
    const content = match[2].trim();
    
    // Extract title - handle both "Title:" and "**Title:**" formats
    let title = content.split('\n')[0].trim();
    
    // Handle **Title: Hotel Name** format
    if (title.includes('**Title:')) {
      const titleMatch = title.match(/\*\*Title:\s*([^*]+)\*\*/i);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
    }
    // Handle Title: Hotel Name format
    else if (title.startsWith('Title:')) {
      title = title.replace(/^Title:\s*/i, '').trim();
    }
    // Handle "1. Title: Hotel Name" format
    else if (title.match(/^\d+\.\s*Title:/)) {
      title = title.replace(/^\d+\.\s*Title:\s*/i, '').trim();
    }
    
    // Clean up any remaining markdown formatting from title
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
    if (!siteMatch) {
      // Try format without colon
      siteMatch = content.match(/Website\s+(\S+)/i);
    }
    if (!siteMatch) {
      // Try format with different spacing
      siteMatch = content.match(/Website:\s*([^\n\r]+)/i);
    }
    
    let website = siteMatch?.[1]?.trim();
    if (website) {
      // Clean up the website - remove any extra text and ensure it's lowercase
      website = website.toLowerCase()
        .replace(/^https?:\/\//, '') // Remove http:// or https://
        .replace(/^www\./, '') // Remove www.
        .replace(/\/.*$/, '') // Remove any path
        .replace(/[^\w.-]/g, '') // Remove any non-alphanumeric characters except dots and hyphens
        .trim();
    }
    
    // Debug website extraction
    console.log(`🔍 WEBSITE EXTRACTION FOR ITEM #${rank}:`, {
      content: content.substring(0, 300),
      siteMatch: siteMatch?.[1],
      finalWebsite: website,
      hasWebsite: !!website
    });
    
    // Extract IsHilton - check if "Hilton" appears in the title
    let hiltonMatch = content.match(/IsHilton:\s*(Yes|No)/i);
    if (!hiltonMatch) {
      // Try inline format like "**IsHilton:** Yes"
      hiltonMatch = content.match(/\*\*IsHilton:\*\*\s*(Yes|No)/i);
    }
    if (!hiltonMatch) {
      // Try format like "IsHilton: Yes" or "IsHilton: No"
      hiltonMatch = content.match(/IsHilton:\s*(Yes|No)/i);
    }
    
    // Find matching ranking analysis for this item by rank position
    const matchingAnalysis = rankingAnalysis?.find(analysis => analysis.rank === rank);
    
    // Use clean target from ranking analysis if available, otherwise use parsed title
    const finalTitle = matchingAnalysis?.target || title;
    
    
    // Hilton detection: Simple and reliable name-based check
    // Only show Hilton badge if the hotel name actually contains Hilton-related terms
    const titleLower = finalTitle.toLowerCase();
    const isHilton = titleLower.includes('hilton');
    
    // Debug logging
    console.log(`🔍 HILTON DETECTION FOR "${finalTitle}":`, {
      titleLower,
      isHilton,
      hiltonMatch: hiltonMatch?.[1] || 'No API match'
    });
    

    const item = {
      rank,
      title: finalTitle,
      description: description || undefined,
      rating,
      priceRange,
      website,
      isHilton,
      why: matchingAnalysis?.llm_reasoning || undefined,
      rankingAnalysis: matchingAnalysis,
    };
    
    items.push(item);
  }
  
  // Debug: Check if we got fewer results than expected
  if (items.length < maxItems) {
    console.warn(`🔍 WARNING: Only parsed ${items.length} items, expected ${maxItems}. This might indicate an API response issue.`);
    console.log('🔍 Full API response text:', text);
  }
  
  console.log(`🔍 FINAL PARSED ITEMS: ${items.length} out of ${maxItems} expected`);
  console.log(`🔍 PARSED ITEM TITLES:`, items.map(item => item.title));
  
  return items;
}

export async function fetchClaudeResults(userQuery: string, monitoringKeyword?: string, pageType?: 'results' | 'select_location'): Promise<{ text: string; rankingAnalysis?: RankingAnalysisResponse[]; improvementRecommendations?: ImprovementRecommendation[]; keywordPosition?: number; monitoringKeyword?: string; }> {
  const body: ClaudeResultsRequest = {
    user_query: userQuery,
    monitoring_keyword: monitoringKeyword || userQuery,
    page_type: pageType || 'results',
  };
  console.log('🔍 Claude API request body:', body);
  const resp = await fetch("/api/claude/results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(await resp.text());
  const data = (await resp.json()) as ClaudeResultsResponse;
  return { 
    text: data.text, 
    rankingAnalysis: data.rankingAnalysis,
    improvementRecommendations: data.improvementRecommendations,
    keywordPosition: data.keywordPosition,
    monitoringKeyword: data.monitoringKeyword
  };
}

export async function fetchGeminiResults(
  userQuery: string,
  monitoringKeyword?: string,
  pageType?: 'results' | 'select_location'
): Promise<{ text: string; rankingAnalysis?: RankingAnalysisResponse[]; improvementRecommendations?: ImprovementRecommendation[]; keywordPosition?: number; monitoringKeyword?: string; }> {
  const body: GeminiResultsRequest = {
    user_query: userQuery,
    monitoring_keyword: monitoringKeyword || userQuery,
    page_type: pageType || 'results', // Default to 'results' for 5 items
  };
  const resp = await fetch("/api/gemini/results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(await resp.text());
  const data = (await resp.json()) as GeminiResultsResponse;
  return { 
    text: data.text, 
    rankingAnalysis: data.rankingAnalysis,
    improvementRecommendations: data.improvementRecommendations,
    keywordPosition: data.keywordPosition,
    monitoringKeyword: data.monitoringKeyword
  };
}

export async function fetchOpenAIResults(
  userQuery: string,
  monitoringKeyword?: string,
  pageType?: 'results' | 'select_location'
): Promise<{ text: string; rankingAnalysis?: RankingAnalysisResponse[]; improvementRecommendations?: ImprovementRecommendation[]; keywordPosition?: number; monitoringKeyword?: string; }> {
  const body: OpenAIResultsRequest = {
    user_query: userQuery,
    monitoring_keyword: monitoringKeyword || userQuery,
    page_type: pageType || 'results',
  };
  const resp = await fetch("/api/openai/results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(await resp.text());
  const data = (await resp.json()) as OpenAIResultsResponse;
  return { 
    text: data.text, 
    rankingAnalysis: data.rankingAnalysis,
    improvementRecommendations: data.improvementRecommendations,
    keywordPosition: data.keywordPosition,
    monitoringKeyword: data.monitoringKeyword
  };
}

export async function fetchPerplexityResults(
  userQuery: string,
  monitoringKeyword?: string,
  pageType?: 'results' | 'select_location'
): Promise<{ text: string; rankingAnalysis?: RankingAnalysisResponse[]; improvementRecommendations?: ImprovementRecommendation[]; keywordPosition?: number; monitoringKeyword?: string; }> {
  const body: PerplexityResultsRequest = {
    user_query: userQuery,
    monitoring_keyword: monitoringKeyword || userQuery,
    page_type: pageType || 'results',
  };
  
  try {
    const resp = await withTimeout(fetch("/api/perplexity/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }), 30000); // 30 second timeout for client
    
    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('Perplexity API error:', resp.status, errorText);
      
      // Handle timeout errors gracefully
      if (resp.status === 408 || resp.status === 504 || errorText.includes('timeout')) {
        return {
          text: `I apologize, but I'm currently experiencing high demand and cannot provide a complete response for your query: "${userQuery}". Please try again in a few moments, or consider using one of the other AI providers available.`,
          rankingAnalysis: [],
          improvementRecommendations: undefined,
          keywordPosition: undefined,
          monitoringKeyword: monitoringKeyword
        };
      }
      
      throw new Error(errorText);
    }
    
    const data = (await resp.json()) as PerplexityResultsResponse;
    return { 
      text: data.text, 
      rankingAnalysis: data.rankingAnalysis,
      improvementRecommendations: data.improvementRecommendations,
      keywordPosition: data.keywordPosition,
      monitoringKeyword: data.monitoringKeyword
    };
  } catch (error) {
    console.error('Perplexity fetch error:', error);
    
    // Return a fallback response for timeout errors
    if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('504'))) {
      return {
        text: `I apologize, but I'm currently experiencing high demand and cannot provide a complete response for your query: "${userQuery}". Please try again in a few moments, or consider using one of the other AI providers available.`,
        rankingAnalysis: [],
        improvementRecommendations: undefined,
        keywordPosition: undefined,
        monitoringKeyword: monitoringKeyword
      };
    }
    
    throw error;
  }
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

export async function fetchProviderResults(provider: ProviderKey, query: string, keyword?: string, pageType?: 'results' | 'select_location'): Promise<{ text: string; rankingAnalysis?: RankingAnalysisResponse[]; improvementRecommendations?: ImprovementRecommendation[]; keywordPosition?: number; monitoringKeyword?: string; }> {
  switch (provider) {
    case "claude":
      return fetchClaudeResults(query, keyword, pageType);
    case "gemini":
      return fetchGeminiResults(query, keyword, pageType);
    case "openai":
      return fetchOpenAIResults(query, keyword, pageType);
    case "perplexity":
      return fetchPerplexityResults(query, keyword, pageType);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// Helper function to add timeout to API calls
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

// Helper function to retry API calls with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>, 
  maxRetries: number = 2, 
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Only retry on timeout errors
      if (lastError.message.includes('timeout') || lastError.message.includes('504')) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`🔄 Retrying API call in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Don't retry on other errors
        break;
      }
    }
  }
  
  throw lastError!;
}

export async function fetchAllProviderItems(
  query: string,
  keyword?: string,
  pageType?: 'results' | 'select_location'
): Promise<{
  providerItems: Record<ProviderKey, ParsedResultItem[]>;
  improvementRecommendations: Record<ProviderKey, ImprovementRecommendation[] | undefined>;
  keywordPositions: Record<ProviderKey, number | undefined>;
}> {
  const providers: ProviderKey[] = ["claude", "openai", "gemini", "perplexity"];
  
  // Use parallel calls with staggered start times to prevent rate limiting
  const results = await Promise.all(
    providers.map(async (p, index) => {
      // Stagger the start times slightly to avoid simultaneous requests
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, 100 * index)); // 100ms, 200ms delays
      }
      
      try {
        // Add retry logic with 30-second timeout to each provider call
        const result = await withRetry(async () => {
          return await withTimeout(fetchProviderResults(p, query, keyword, pageType), 30000);
        }, 1, 1000); // 1 retry with 1s base delay
        
        console.log(`🔍 PROVIDER ${p} RESULT:`, {
          textLength: result.text.length,
          textPreview: result.text.substring(0, 200),
          rankingAnalysis: result.rankingAnalysis,
          rankingAnalysisLength: result.rankingAnalysis?.length,
          improvementRecommendations: result.improvementRecommendations,
          keywordPosition: result.keywordPosition
        });
        const items = parseStrictListResponse(result.text, result.rankingAnalysis);
        return [p, { items, improvementRecommendations: result.improvementRecommendations, keywordPosition: result.keywordPosition }] as const;
      } catch (err) {
        console.error(`Failed to fetch from ${p} after retries:`, err);
        
        // Check if it's a timeout, credit/API key issue, or other error
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes('timed out') || errorMessage.includes('timeout')) {
          console.warn(`⏰ ${p.toUpperCase()} request timed out after retries`);
        } else if (errorMessage.includes('credit balance') || errorMessage.includes('API key')) {
          console.warn(`⚠️ ${p.toUpperCase()} API issue: ${errorMessage}`);
        } else {
          console.warn(`❌ ${p.toUpperCase()} error: ${errorMessage}`);
        }
        
        return [p, { items: [] as ParsedResultItem[], improvementRecommendations: undefined, keywordPosition: undefined }] as const;
      }
    })
  );
  
  const providerItems: Record<ProviderKey, ParsedResultItem[]> = {
    claude: [], openai: [], perplexity: [], gemini: []
  };
  const improvementRecommendations: Record<ProviderKey, ImprovementRecommendation[] | undefined> = {
    claude: undefined, openai: undefined, perplexity: undefined, gemini: undefined
  };
  const keywordPositions: Record<ProviderKey, number | undefined> = {
    claude: undefined, openai: undefined, perplexity: undefined, gemini: undefined
  };
  
  results.forEach(([p, data]) => {
    providerItems[p] = data.items;
    improvementRecommendations[p] = data.improvementRecommendations;
    keywordPositions[p] = data.keywordPosition;
  });
  
  return {
    providerItems,
    improvementRecommendations,
    keywordPositions
  };
}
