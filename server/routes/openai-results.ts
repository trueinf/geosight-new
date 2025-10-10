import type { RequestHandler } from "express";
import type { OpenAIResultsRequest, OpenAIResultsResponse, RankingAnalysisResponse } from "@shared/api";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// Helper function to extract location from user query
function extractLocationFromQuery(user_query: string): string {
  const locationMatch = user_query.match(/List 20 different hotels in ([^in]+) in 4 categories/);
  return locationMatch ? locationMatch[1].trim() : "the specified location";
}

export const handleOpenAIResults: RequestHandler = async (req, res) => {
  try {
    const { user_query, monitoring_keyword, page_type }: OpenAIResultsRequest = req.body ?? {};
    console.log('🔍 OpenAI handler - page_type:', page_type);
    console.log('🔍 OpenAI handler - isSelectLocationPage:', page_type === 'select_location');

    if (!process.env.OPENAI_API_KEY) {
      res.status(500).json({ error: "Missing OPENAI_API_KEY" });
      return;
    }

    if (!user_query || typeof user_query !== "string") {
      res.status(400).json({ error: "user_query is required" });
      return;
    }

    // Determine if this is for Select Location page (20 results) or Results page (5 results)
    const isSelectLocationPage = page_type === 'select_location';
    
    console.log('🔍 OpenAI - page_type:', page_type);
    console.log('🔍 OpenAI - isSelectLocationPage:', isSelectLocationPage);
    console.log('🔍 OpenAI - Expected results:', isSelectLocationPage ? '20 (4 categories × 5 each)' : '5 (single list)');
    
    let prompt: string;
    let maxTokens: number;
    
    if (isSelectLocationPage) {
      // Hotel location query - 20 results in 4 categories
      prompt = `Query: "${user_query}"

You MUST respond with EXACTLY this format. Do not change anything:

**Best Hotels (5 results):**

1. Title: [Actual Hotel Name]

Description: [Brief description]

Rating: [X.X/5 if available]

Price: $[price if available]

Website: [website name only, e.g., "marriott.com" or "hilton.com"]

IsHilton: [Yes if this is a Hilton hotel, No if not]



2. Title: [Actual Hotel Name]

Description: [Brief description]

Rating: [X.X/5 if available]

Price: $[price if available]

Website: [website name only, e.g., "marriott.com" or "hilton.com"]

IsHilton: [Yes if this is a Hilton hotel, No if not]




3. Title: [Actual Hotel Name]

Description: [Brief description]

Rating: [X.X/5 if available]

Price: $[price if available]

Website: [website name only, e.g., "marriott.com" or "hilton.com"]

IsHilton: [Yes if this is a Hilton hotel, No if not]




4. Title: [Actual Hotel Name]

Description: [Brief description]

Rating: [X.X/5 if available]

Price: $[price if available]

Website: [website name only, e.g., "marriott.com" or "hilton.com"]

IsHilton: [Yes if this is a Hilton hotel, No if not]




5. Title: [Actual Hotel Name]

Description: [Brief description]

Rating: [X.X/5 if available]

Price: $[price if available]

Website: [website name only, e.g., "marriott.com" or "hilton.com"]

IsHilton: [Yes if this is a Hilton hotel, No if not]




**Best Luxury Hotels (5 results):**

1. Title: [Actual Hotel Name]

Description: [Brief description]

Rating: [X.X/5 if available]

Price: $[price if available]

Website: [website name only, e.g., "marriott.com" or "hilton.com"]

IsHilton: [Yes if this is a Hilton hotel, No if not]  


2. Title: [Actual Hotel Name]

Description: [Brief description]

Rating: [X.X/5 if available]

Price: $[price if available]

Website: [website name only, e.g., "marriott.com" or "hilton.com"]

IsHilton: [Yes if this is a Hilton hotel, No if not]




3. Title: [Actual Hotel Name]

Description: [Brief description]

Rating: [X.X/5 if available]

Price: $[price if available]

Website: [website name only, e.g., "marriott.com" or "hilton.com"]

IsHilton: [Yes if this is a Hilton hotel, No if not]




4. Title: [Actual Hotel Name]

Description: [Brief description]

Rating: [X.X/5 if available]

Price: $[price if available]

Website: [website name only, e.g., "marriott.com" or "hilton.com"]

IsHilton: [Yes if this is a Hilton hotel, No if not]




5. Title: [Actual Hotel Name]

Description: [Brief description]

Rating: [X.X/5 if available]

Price: $[price if available]

Website: [website name only, e.g., "marriott.com" or "hilton.com"]

IsHilton: [Yes if this is a Hilton hotel, No if not]




**Best Business Hotels (5 results):**

1. Title: [Actual Hotel Name]

Description: [Brief description]

Rating: [X.X/5 if available]

Price: $[price if available]

Website: [website name only, e.g., "marriott.com" or "hilton.com"]

IsHilton: [Yes if this is a Hilton hotel, No if not]  


2. Title: [Actual Hotel Name]

Description: [Brief description]

Rating: [X.X/5 if available]

Price: $[price if available]

Website: [website name only, e.g., "marriott.com" or "hilton.com"]

IsHilton: [Yes if this is a Hilton hotel, No if not]




3. Title: [Actual Hotel Name]

Description: [Brief description]

Rating: [X.X/5 if available]

Price: $[price if available]

Website: [website name only, e.g., "marriott.com" or "hilton.com"]

IsHilton: [Yes if this is a Hilton hotel, No if not]




4. Title: [Actual Hotel Name]

Description: [Brief description]

Rating: [X.X/5 if available]

Price: $[price if available]

Website: [website name only, e.g., "marriott.com" or "hilton.com"]

IsHilton: [Yes if this is a Hilton hotel, No if not]




5. Title: [Actual Hotel Name]

Description: [Brief description]

Rating: [X.X/5 if available]

Price: $[price if available]

Website: [website name only, e.g., "marriott.com" or "hilton.com"]

IsHilton: [Yes if this is a Hilton hotel, No if not]




**Best Family Hotels (5 results):**

1. Title: [Actual Hotel Name]

Description: [Brief description]

Rating: [X.X/5 if available]

Price: $[price if available]

Website: [website name only, e.g., "marriott.com" or "hilton.com"]

IsHilton: [Yes if this is a Hilton hotel, No if not]



2. Title: [Actual Hotel Name]

Description: [Brief description]

Rating: [X.X/5 if available]

Price: $[price if available]

Website: [website name only, e.g., "marriott.com" or "hilton.com"]

IsHilton: [Yes if this is a Hilton hotel, No if not]




3. Title: [Actual Hotel Name]

Description: [Brief description]

Rating: [X.X/5 if available]

Price: $[price if available]

Website: [website name only, e.g., "marriott.com" or "hilton.com"]

IsHilton: [Yes if this is a Hilton hotel, No if not]




4. Title: [Actual Hotel Name]

Description: [Brief description]

Rating: [X.X/5 if available]

Price: $[price if available]

Website: [website name only, e.g., "marriott.com" or "hilton.com"]

IsHilton: [Yes if this is a Hilton hotel, No if not]




5. Title: [Actual Hotel Name]

Description: [Brief description]

Rating: [X.X/5 if available]

Price: $[price if available]

Website: [website name only, e.g., "marriott.com" or "hilton.com"]

IsHilton: [Yes if this is a Hilton hotel, No if not]




ABSOLUTE REQUIREMENTS:

- Your response MUST start with "**Best Hotels (5 results):**"

- You MUST include all 4 category headers exactly as shown above

- You MUST provide exactly 5 items under each category

- Use REAL hotel names, not placeholders

- Do NOT add any introductory text

- Do NOT add any concluding text

- Do NOT deviate from this format

CRITICAL HILTON DETECTION RULES:
- ONLY mark as "Yes" if the hotel name contains: "Hilton"
- Do NOT mark as "Yes" for: Marriott, Hyatt, Fairmont, Four Seasons, Ritz-Carlton, Westin, Sheraton, InterContinental, Holiday Inn, Best Western, or any other hotel chains
- If the hotel name does not contain any Hilton brand names, mark as "No"

START YOUR RESPONSE NOW WITH: "**Best Hotels (5 results):**"`;
      maxTokens = 4000; // More tokens for 20 results + JSON
    } else {
      // Generic query - 5 results only
      prompt = `Query: "${user_query}"

Provide exactly 5 relevant results with REAL information. Do NOT use placeholder text like [Item Name] or [Brief description]. Use actual names, descriptions, and website URLs.

Format each result exactly like this:

1. Title: [Actual Product/Service Name]
Description: [Actual detailed description of the product/service]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [website name only, e.g., "marriott.com" or "hilton.com"]

2. Title: [Actual Product/Service Name]
Description: [Actual detailed description of the product/service]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [website name only, e.g., "marriott.com" or "hilton.com"]

3. Title: [Actual Product/Service Name]
Description: [Actual detailed description of the product/service]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [website name only, e.g., "marriott.com" or "hilton.com"]

4. Title: [Actual Product/Service Name]
Description: [Actual detailed description of the product/service]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [website name only, e.g., "marriott.com" or "hilton.com"]

5. Title: [Actual Product/Service Name]
Description: [Actual detailed description of the product/service]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [website name only, e.g., "marriott.com" or "hilton.com"]

IMPORTANT: 
- Replace ALL placeholder text with real information
- Provide actual product/service names
- Write detailed descriptions (at least 1-2 sentences)
- For Website field: Use ONLY the domain name (e.g., "marriott.com", "hilton.com") - NO full URLs or HTML links
- Use real ratings and prices when known`;
      maxTokens = isSelectLocationPage ? 4000 : 2000; // More tokens for 20 results
    }

    // For Select Location page, don't add JSON template - let server parsing handle it
    // This is similar to how Gemini works successfully
    if (isSelectLocationPage) {
      prompt += `\n\nIMPORTANT: Provide EXACTLY 20 hotels across all 4 categories. Do not skip any items.`;
    } else {
      prompt += `\n\nIMPORTANT: Provide EXACTLY 5 results. Do not skip any items.`;
    }

    // Retry wrapper for OpenAI with timeout
    async function callOpenAI() {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
      
      try {
        const response = await fetch(OPENAI_URL, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are a helpful assistant that MUST follow the exact format provided. Do not deviate from the specified format. Always include category headers and follow the exact structure shown."
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            max_tokens: maxTokens,
            temperature: 0.1,
          }),
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('OpenAI request timed out after 20 seconds');
        }
        throw error;
      }
    }

    let resp;
    let openaiError = null;

    try {
      console.log('🔍 OpenAI - Making API call with prompt length:', prompt.length);
      console.log('🔍 OpenAI - Using model: gpt-3.5-turbo');
      console.log('🔍 OpenAI - Max tokens:', maxTokens);
      resp = await callOpenAI();

      if (!resp.ok) {
        const text = await resp.text();
        console.error('❌ OpenAI API error response:', {
          status: resp.status,
          statusText: resp.statusText,
          body: text
        });
        openaiError = { error: "OpenAI request failed", details: text };
      }
    } catch (error: any) {
      console.error('❌ OpenAI request error:', error);
      openaiError = { 
        error: "OpenAI request failed", 
        details: error.message || "API request failed"
      };
    }

    // If OpenAI fails, try a simpler prompt first
    if (openaiError) {
      console.log('⚠️ OpenAI failed with complex prompt, trying simpler approach...');
      
      try {
        // Try with a much simpler prompt
        const simplePrompt = `List ${isSelectLocationPage ? '20' : '5'} hotels in ${monitoring_keyword || 'the specified location'} with this format:

1. Title: [Hotel Name]
Description: [Brief description]
Rating: [X.X/5]
Price: $[price range]
Website: [hotel website]
IsHilton: [Yes if this is a Hilton hotel, No if not]

${isSelectLocationPage ? 'Continue for all 20 hotels across 4 categories (Best Hotels, Luxury Hotels, Business Hotels, Family Hotels).' : 'Continue for all 5 hotels.'}

CRITICAL HILTON DETECTION RULES:
- ONLY mark as "Yes" if the hotel name contains: "Hilton"
- Do NOT mark as "Yes" for: Marriott, Hyatt, Fairmont, Four Seasons, Ritz-Carlton, Westin, Sheraton, InterContinental, Holiday Inn, Best Western, or any other hotel chains
- If the hotel name does not contain any Hilton brand names, mark as "No"

Provide real hotel information, not placeholders.`;

        const simpleResponse = await fetch(OPENAI_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are a helpful assistant that provides hotel information in the exact format requested."
              },
              {
                role: "user",
                content: simplePrompt,
              },
            ],
            max_tokens: isSelectLocationPage ? 3000 : 1500,
            temperature: 0.1,
          }),
        });

        if (simpleResponse.ok) {
          const simpleData = await simpleResponse.json();
          const simpleText = simpleData?.choices?.[0]?.message?.content ?? "";
          console.log('✅ Simple prompt succeeded, using that response');
          
          // Parse the simple response and create basic ranking analysis
          const items = simpleText.match(/(\d+)\.\s*Title:\s*([^\n]+)/g)?.map((match, index) => {
            const titleMatch = match.match(/Title:\s*([^\n]+)/);
            return {
              rank: index + 1,
              title: titleMatch?.[1]?.trim() || `Hotel ${index + 1}`,
              description: '',
              rating: '',
              priceRange: '',
              website: '',
              isHilton: false,
              why: undefined,
              rankingAnalysis: undefined
            };
          }) || [];
          const rankingAnalysis = items.map((item, index) => ({
            provider: "openai",
            target: item.title,
            rank: index + 1,
            matched_keywords: [monitoring_keyword || "hotel"],
            contextual_signals: ["location", "rating", "price"],
            competitor_presence: [],
            sentiment: "positive" as const,
            citation_domains: [item.website || "hotel website"],
            llm_reasoning: `Ranked #${index + 1} based on relevance to the search query.`
          }));

          const payload: OpenAIResultsResponse = { 
            text: simpleText,
            rankingAnalysis: rankingAnalysis,
            keywordPosition: undefined,
            monitoringKeyword: monitoring_keyword,
            improvementRecommendations: undefined
          };
          
          res.json(payload);
          return;
        }
      } catch (simpleError) {
        console.error('❌ Simple prompt also failed:', simpleError);
      }

      // If even the simple prompt fails, return the fallback
      console.log('⚠️ All OpenAI attempts failed, returning fallback response');
      const fallbackText = `I apologize, but I'm currently experiencing technical difficulties and cannot provide a complete response for your query: "${user_query}". 

Please try again in a few moments, or consider using one of the other AI providers available.`;

      const payload: OpenAIResultsResponse = { 
        text: fallbackText,
        rankingAnalysis: [],
        keywordPosition: undefined,
        monitoringKeyword: monitoring_keyword,
        improvementRecommendations: undefined
      };
      res.json(payload);
      return;
    }

    const json = (await resp.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json?.choices?.[0]?.message?.content ?? "";
    
    console.log('🔍 OpenAI full response text:', text);
    console.log('🔍 OpenAI response contains improvement_recommendations:', text.includes('improvement_recommendations'));

    // Check if monitoring keyword appears in the results
    let keywordPosition = -1;
    if (monitoring_keyword) {
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('Title:') && line.toLowerCase().includes(monitoring_keyword.toLowerCase())) {
          // Extract position number from the preceding numbered list item
          for (let j = i - 1; j >= 0; j--) {
            const match = lines[j].match(/^(\d+)\)/);
            if (match) {
              keywordPosition = parseInt(match[1]);
              break;
            }
          }
          break;
        }
      }
    }

    // Try to extract ranking analysis and improvement recommendations from the response
    let rankingAnalysis: RankingAnalysisResponse[] = [];
    let improvementRecommendations = [];
    try {
      // Look for JSON block with ranking_analysis - be more flexible with formatting
      const jsonPattern = /\{\s*"ranking_analysis"\s*:/;
      const jsonMatch = text.match(jsonPattern);
      
      if (jsonMatch) {
        const jsonStart = jsonMatch.index!;
        const jsonText = text.substring(jsonStart);
        
        // Try to find the end of the JSON object by counting braces
        let braceCount = 0;
        let jsonEnd = -1;
        
        for (let i = 0; i < jsonText.length; i++) {
          if (jsonText[i] === '{') braceCount++;
          if (jsonText[i] === '}') braceCount--;
          if (braceCount === 0) {
            jsonEnd = i + 1;
            break;
          }
        }
        
        if (jsonEnd !== -1) {
          const jsonString = jsonText.substring(0, jsonEnd);
          console.log('🔍 Extracted JSON string:', jsonString);
          const analysisData = JSON.parse(jsonString);
          rankingAnalysis = analysisData.ranking_analysis || [];
          improvementRecommendations = analysisData.improvement_recommendations || [];
          console.log('🔍 Parsed ranking analysis:', rankingAnalysis);
          console.log('🔍 Parsed improvement recommendations from main JSON:', improvementRecommendations);
          
          // Also try to extract improvement recommendations
          // Try multiple patterns for improvement recommendations
          let improvementStart = text.indexOf('{\n  "improvement_recommendations":');
          if (improvementStart === -1) {
            improvementStart = text.indexOf('{ "improvement_recommendations":');
          }
          if (improvementStart === -1) {
            improvementStart = text.indexOf('"improvement_recommendations":');
          }
          if (improvementStart !== -1) {
            const improvementText = text.substring(improvementStart);
            let improvementBraceCount = 0;
            let improvementEnd = -1;
            
            for (let i = 0; i < improvementText.length; i++) {
              if (improvementText[i] === '{') improvementBraceCount++;
              if (improvementText[i] === '}') improvementBraceCount--;
              if (improvementBraceCount === 0) {
                improvementEnd = i + 1;
                break;
              }
            }
            
            if (improvementEnd !== -1) {
              try {
                const improvementJsonString = improvementText.substring(0, improvementEnd);
                console.log('🔍 OpenAI extracted improvement JSON:', improvementJsonString);
                const improvementData = JSON.parse(improvementJsonString);
                improvementRecommendations = improvementData.improvement_recommendations || [];
                console.log('🔍 OpenAI parsed improvement recommendations:', improvementRecommendations);
              } catch (e) {
                console.log('🔍 OpenAI failed to parse improvement recommendations:', e);
              }
            }
          }
        } else {
          // Try to extract partial JSON if it's truncated
          console.log('🔍 JSON appears truncated, trying to extract partial data');
          try {
            // Look for individual ranking analysis objects
            const analysisMatches = jsonText.matchAll(/\{\s*"provider"[^}]*"llm_reasoning"[^}]*\}/g);
            for (const match of analysisMatches) {
              try {
                const partialAnalysis = JSON.parse(match[0]);
                if (partialAnalysis.provider && partialAnalysis.llm_reasoning) {
                  rankingAnalysis.push(partialAnalysis);
                }
              } catch (e) {
                console.log('🔍 Failed to parse partial analysis:', match[0]);
              }
            }
            console.log('🔍 Extracted partial ranking analysis:', rankingAnalysis);
          } catch (error) {
            console.log('🔍 Failed to extract partial JSON:', error);
          }
        }
      } else {
        console.log('🔍 No ranking_analysis JSON found in response');
        console.log('🔍 Response text preview:', text.substring(0, 500));
        
        // Try to parse ranking analysis from text format
        console.log('🔍 Trying to parse ranking analysis from text format...');
        // Only parse from the "Ranking Analysis" section
        const rankingAnalysisSection = text.match(/### Ranking Analysis([\s\S]*?)(?=### |$)/);
        const textForRankingAnalysis = rankingAnalysisSection ? rankingAnalysisSection[1] : '';
        const rankingAnalysisMatches = textForRankingAnalysis.matchAll(/(\d+)\.\s*\*\*([^*]+)\*\*[\s\S]*?- Target:\s*([^\n-]+)[\s\S]*?- Rank:\s*(\d+)[\s\S]*?- Matched Keywords:\s*([^\n]+)[\s\S]*?- Contextual Signals:\s*([^\n]+)[\s\S]*?- Competitor Presence:\s*([^\n]+)[\s\S]*?- Sentiment:\s*([^\n]+)[\s\S]*?- Citation Domains:\s*([^\n]+)[\s\S]*?- LLM Reasoning:\s*([^\n]+)/g);
        const rankingAnalysisFromText = Array.from(rankingAnalysisMatches);
        
        if (rankingAnalysisFromText.length > 0) {
          console.log('🔍 Found', rankingAnalysisFromText.length, 'ranking analysis items in text format');
          for (const match of rankingAnalysisFromText) {
            const rank = parseInt(match[4]);
            let target = match[3].trim();
            
            // Clean up target field - remove redundant "- Target:" part if present
            if (target.includes(' - Target:')) {
              target = target.split(' - Target:')[0].trim();
            }
            
            const matchedKeywords = match[5].trim().split(',').map(k => k.trim());
            const contextualSignals = match[6].trim().split(',').map(s => s.trim());
            const competitorPresence = match[7].trim().split(',').map(c => c.trim());
            const sentimentRaw = match[8].trim().toLowerCase();
            const sentiment = (sentimentRaw === 'positive' || sentimentRaw === 'negative' || sentimentRaw === 'neutral') 
              ? sentimentRaw as 'positive' | 'negative' | 'neutral' 
              : 'positive';
            const citationDomains = match[9].trim().split(',').map(d => d.trim());
            const reasoning = match[10].trim();
            
            console.log('🔍 Parsed ranking analysis:', { rank, target, matchedKeywords, contextualSignals, competitorPresence, sentiment, citationDomains, reasoning });
            
            rankingAnalysis.push({
              provider: "openai",
              target: target,
              rank: rank,
              matched_keywords: matchedKeywords,
              contextual_signals: contextualSignals,
              competitor_presence: competitorPresence,
              sentiment: sentiment,
              citation_domains: citationDomains,
              llm_reasoning: reasoning
            });
          }
        } else {
          console.log('🔍 No ranking analysis found in text format, creating default ranking analysis for items found in text');
        }
        
        // Create default ranking analysis for items found in text (fallback)
        // Exclude "Ranking Analysis" and "Improvement Recommendations" sections from parsing
        let textToParse = text;
        const rankingAnalysisIndex = text.indexOf('### Ranking Analysis');
        const improvementIndex = text.indexOf('### Improvement Recommendations');
        const stopIndex = Math.min(
          rankingAnalysisIndex > -1 ? rankingAnalysisIndex : text.length,
          improvementIndex > -1 ? improvementIndex : text.length
        );
        if (stopIndex < text.length) {
          textToParse = text.substring(0, stopIndex);
          console.log('🔍 Backend - Excluding ranking analysis section, parsing text up to index:', stopIndex);
        }
        
        const itemMatchesAnalysis = textToParse.matchAll(/(\d+)[\.)]\s*([\s\S]*?)(?=\n\s*\d+[\.)]\s|$)/g);
        const allMatchesAnalysis = Array.from(itemMatchesAnalysis);
        
        for (const match of allMatchesAnalysis) {
          const rank = parseInt(match[1]);
          if (rank > 5) {
            console.log('🔍 OpenAI - Stopping at rank', rank, 'to limit to 5 results for Results page');
            break; // Only process first 5 items
          }
          
          const content = match[2].trim();
        // Handle both "Title:" and "**Title:**" formats
        let titleMatch = content.match(/\*\*Title:\s*([^*]+)\*\*/i);
        if (!titleMatch) {
          titleMatch = content.match(/Title:\s*([^\n]+)/i);
        }
        const title = titleMatch?.[1]?.trim() || `Item ${rank}`;
          
          // Enhanced pattern matching for different formats
          const descriptionMatch = content.match(/Description:\s*([^\n]+)/i) || 
                                 content.match(/Description\s*:\s*([^\n]+)/i) ||
                                 content.match(/\*\*Description:\s*([^*]+)\*\*/i);
          const websiteMatch = content.match(/Website:\s*([^\n]+)/i) || 
                              content.match(/Website\s*:\s*([^\n]+)/i) ||
                              content.match(/\*\*Website:\s*([^*]+)\*\*/i);
          const ratingMatch = content.match(/Rating:\s*([^\n]+)/i) || 
                             content.match(/Rating\s*:\s*([^\n]+)/i) ||
                             content.match(/\*\*Rating:\s*([^*]+)\*\*/i);
          
          console.log('🔍 OpenAI - Content analysis:', {
            title,
            hasDescription: !!descriptionMatch,
            hasWebsite: !!websiteMatch,
            hasRating: !!ratingMatch,
            descriptionText: descriptionMatch?.[1]?.substring(0, 50),
            ratingText: ratingMatch?.[1]?.substring(0, 20)
          });
          
          // Extract meaningful keywords from the user query
          const queryWords = user_query.toLowerCase().split(/\s+/).filter(word => 
            word.length > 2 && !['the', 'and', 'or', 'in', 'of', 'for', 'with', 'to'].includes(word)
          );
          const matchedKeywords = [...queryWords];
          if (title.toLowerCase().includes(user_query.toLowerCase())) {
            matchedKeywords.push(title.toLowerCase());
          }
          
          const contextualSignals = ["search relevance", "user query match"];
          if (descriptionMatch && descriptionMatch[1] && descriptionMatch[1].trim().length > 0) {
            contextualSignals.push("detailed description available");
            console.log('🔍 OpenAI - Added "detailed description available"');
          }
          if (ratingMatch && ratingMatch[1] && ratingMatch[1] !== "X.X/5 if available" && ratingMatch[1].trim().length > 0) {
            contextualSignals.push("rating information provided");
            console.log('🔍 OpenAI - Added "rating information provided"');
          }
          
          // Generate competitor presence based on other items
          const competitorPresence = allMatchesAnalysis
            .filter((_, index) => index !== allMatchesAnalysis.indexOf(match))
            .slice(0, 3)
            .map(compMatch => {
              const compTitleMatch = compMatch[2].match(/Title:\s*([^\n]+)/i);
              return compTitleMatch?.[1]?.trim() || "Unknown competitor";
            });
          
          // Generate citation domains based on website information
          const citationDomains = [];
          if (websiteMatch && websiteMatch[1] && websiteMatch[1] !== "website name only, e.g., \"brooksrunning.com\" or \"saucony.com\"") {
            let website = websiteMatch[1].trim();
            // Clean up the website format
            website = website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
            if (website && website.length > 0) {
              citationDomains.push(website);
            }
          }
          
          // Generate more specific reasoning based on rank
          let reasoning = `Ranked #${rank} in the search results for "${user_query}".`;
          if (rank === 1) {
            reasoning += ` Top choice due to strong relevance and comprehensive information.`;
          } else if (rank <= 3) {
            reasoning += ` High-quality option with good features and ratings.`;
          } else {
            reasoning += ` Solid alternative with competitive offerings.`;
          }
          if (descriptionMatch) {
            reasoning += ` Features detailed description highlighting key benefits.`;
          }
          if (ratingMatch && ratingMatch[1] !== "X.X/5 if available") {
            reasoning += ` Includes rating information (${ratingMatch[1]}).`;
          }
          if (websiteMatch && websiteMatch[1] !== "website name only, e.g., \"brooksrunning.com\" or \"saucony.com\"") {
            reasoning += ` Available on ${websiteMatch[1].trim()}.`;
          }
          
          rankingAnalysis.push({
            provider: "openai",
            target: title,
            rank: rank,
            matched_keywords: matchedKeywords,
            contextual_signals: contextualSignals,
            competitor_presence: competitorPresence,
            sentiment: "positive",
            citation_domains: citationDomains,
            llm_reasoning: reasoning
          });
        }
        
        console.log('🔍 Created default ranking analysis:', rankingAnalysis);
        
        // Create default improvement recommendations if monitoring keyword exists
        if (monitoring_keyword) {
          console.log('🔍 Creating default improvement recommendations for monitoring keyword:', monitoring_keyword);
          improvementRecommendations = [
            {
              "title": "Enhance Online Presence",
              "description": `Optimize website content with relevant keywords to improve visibility in search results and attract more online bookings for ${monitoring_keyword}.`,
              "category": "SEO & Content Strategy",
              "timeframe": "immediate",
              "expectedImpact": "Improved search engine ranking and increased website traffic."
            },
            {
              "title": "Collaborate with Influential Reviewers",
              "description": `Partner with popular industry influencers to showcase the unique offerings and experiences of ${monitoring_keyword}, increasing brand visibility.`,
              "category": "Authority & Citation Strategy",
              "timeframe": "mid-term",
              "expectedImpact": "Expanded reach and enhanced credibility among target audience."
            },
            {
              "title": "Create Exclusive Brand Programs",
              "description": `Develop tailored programs for customers, providing incentives for repeat engagement and fostering brand loyalty for ${monitoring_keyword}.`,
              "category": "Brand Strategy",
              "timeframe": "long-term",
              "expectedImpact": "Increased customer retention and positive brand association."
            },
            {
              "title": "Implement Mobile-Friendly Website Design",
              "description": `Optimize the website for mobile users to enhance user experience and accessibility, catering to the growing number of users accessing ${monitoring_keyword} via mobile devices.`,
              "category": "Technical Improvements",
              "timeframe": "immediate",
              "expectedImpact": "Higher conversion rates and improved customer satisfaction."
            }
          ];
        }
      }
    } catch (error) {
      console.error('Failed to parse ranking analysis:', error);
      console.error('Error details:', error);
    }

    // Ensure we always have some ranking analysis, even if parsing failed
    if (rankingAnalysis.length === 0) {
      console.log('🔍 No ranking analysis found, creating fallback...');
      // Exclude "Ranking Analysis" and "Improvement Recommendations" sections from parsing
      let textToParse = text;
      const rankingAnalysisIndex = text.indexOf('### Ranking Analysis');
      const improvementIndex = text.indexOf('### Improvement Recommendations');
      const stopIndex = Math.min(
        rankingAnalysisIndex > -1 ? rankingAnalysisIndex : text.length,
        improvementIndex > -1 ? improvementIndex : text.length
      );
      if (stopIndex < text.length) {
        textToParse = text.substring(0, stopIndex);
        console.log('🔍 Fallback - Excluding ranking analysis section, parsing text up to index:', stopIndex);
      }
      
      // Use a simple regex that matches the actual format: "1. **Title: Hotel Name**"
      const itemMatchesAnalysis = textToParse.matchAll(/(\d+)\.\s*\*\*Title:\s*([^*]+)\*\*/g);
      const allMatchesAnalysis = Array.from(itemMatchesAnalysis);
      
      console.log('🔍 OpenAI - Found', allMatchesAnalysis.length, 'potential items in fallback parsing');
      console.log('🔍 OpenAI - Text to parse length:', textToParse.length);
      console.log('🔍 OpenAI - Text to parse preview:', textToParse.substring(0, 500));
      
      // Process the matches
      for (const match of allMatchesAnalysis) {
        const rank = parseInt(match[1]);
        const maxItems = isSelectLocationPage ? 20 : 5;
        if (rank > maxItems) {
          console.log('🔍 OpenAI - Stopping at rank', rank, 'to limit to', maxItems, 'results for', isSelectLocationPage ? 'Select Location' : 'Results', 'page (fallback)');
          break;
        }
        
        const title = match[2].trim();
        console.log('🔍 OpenAI - Processing rank', rank, 'title:', title);
        
        rankingAnalysis.push({
          provider: "openai",
          target: title,
          rank: rank,
          matched_keywords: [user_query.toLowerCase()],
          contextual_signals: ["search relevance", "user query match"],
          competitor_presence: [],
          sentiment: "positive",
          citation_domains: [],
          llm_reasoning: `Ranked #${rank} based on relevance to hotels in ${extractLocationFromQuery(user_query)}.`
        });
      }
      
      console.log('🔍 Created fallback ranking analysis:', rankingAnalysis.length, 'items');
      
      // Create default improvement recommendations if monitoring keyword exists and no recommendations were found
      if (monitoring_keyword && improvementRecommendations.length === 0) {
        console.log('🔍 Creating fallback improvement recommendations for monitoring keyword:', monitoring_keyword);
        improvementRecommendations = [
          {
            "title": "Enhance Online Presence",
            "description": `Optimize website content with relevant keywords to improve visibility in search results and attract more online bookings for ${monitoring_keyword}.`,
            "category": "SEO & Content Strategy",
            "timeframe": "immediate",
            "expectedImpact": "Improved search engine ranking and increased website traffic."
          },
          {
            "title": "Collaborate with Influential Reviewers",
            "description": `Partner with popular industry influencers to showcase the unique offerings and experiences of ${monitoring_keyword}, increasing brand visibility.`,
            "category": "Authority & Citation Strategy",
            "timeframe": "mid-term",
            "expectedImpact": "Expanded reach and enhanced credibility among target audience."
          },
          {
            "title": "Create Exclusive Brand Programs",
            "description": `Develop tailored programs for customers, providing incentives for repeat engagement and fostering brand loyalty for ${monitoring_keyword}.`,
            "category": "Brand Strategy",
            "timeframe": "long-term",
            "expectedImpact": "Increased customer retention and positive brand association."
          },
          {
            "title": "Implement Mobile-Friendly Website Design",
            "description": `Optimize the website for mobile users to enhance user experience and accessibility, catering to the growing number of users accessing ${monitoring_keyword} via mobile devices.`,
            "category": "Technical Improvements",
            "timeframe": "immediate",
            "expectedImpact": "Higher conversion rates and improved customer satisfaction."
          }
        ];
      }
    }

    // Debug: Log improvement recommendations status
    console.log('🔍 Final improvement recommendations check:');
    console.log('🔍 monitoring_keyword:', monitoring_keyword);
    console.log('🔍 improvementRecommendations.length:', improvementRecommendations.length);
    
    // Ensure improvement recommendations are created if monitoring keyword exists
    if (monitoring_keyword && improvementRecommendations.length === 0) {
      console.log('🔍 Creating final fallback improvement recommendations for monitoring keyword:', monitoring_keyword);
      improvementRecommendations = [
        {
          "title": "Enhance Online Presence",
          "description": `Optimize website content with relevant keywords to improve visibility in search results and attract more online bookings for ${monitoring_keyword}.`,
          "category": "SEO & Content Strategy",
          "timeframe": "immediate",
          "expectedImpact": "Improved search engine ranking and increased website traffic."
        },
        {
          "title": "Collaborate with Influential Reviewers",
          "description": `Partner with popular industry influencers to showcase the unique offerings and experiences of ${monitoring_keyword}, increasing brand visibility.`,
          "category": "Authority & Citation Strategy",
          "timeframe": "mid-term",
          "expectedImpact": "Expanded reach and enhanced credibility among target audience."
        },
        {
          "title": "Create Exclusive Brand Programs",
          "description": `Develop tailored programs for customers, providing incentives for repeat engagement and fostering brand loyalty for ${monitoring_keyword}.`,
          "category": "Brand Strategy",
          "timeframe": "long-term",
          "expectedImpact": "Increased customer retention and positive brand association."
        },
        {
          "title": "Implement Mobile-Friendly Website Design",
          "description": `Optimize the website for mobile users to enhance user experience and accessibility, catering to the growing number of users accessing ${monitoring_keyword} via mobile devices.`,
          "category": "Technical Improvements",
          "timeframe": "immediate",
          "expectedImpact": "Higher conversion rates and improved customer satisfaction."
        }
      ];
    }

    // Final safety check: ensure improvement recommendations are always present when monitoring keyword exists
    if (monitoring_keyword && (!improvementRecommendations || improvementRecommendations.length === 0)) {
      console.log('🔍 Final safety check: Creating improvement recommendations for monitoring keyword:', monitoring_keyword);
      improvementRecommendations = [
        {
          "title": "Enhance Online Presence",
          "description": `Optimize website content with relevant keywords to improve visibility in search results and attract more online bookings for ${monitoring_keyword}.`,
          "category": "SEO & Content Strategy",
          "timeframe": "immediate",
          "expectedImpact": "Improved search engine ranking and increased website traffic."
        },
        {
          "title": "Collaborate with Influential Reviewers",
          "description": `Partner with popular industry influencers to showcase the unique offerings and experiences of ${monitoring_keyword}, increasing brand visibility.`,
          "category": "Authority & Citation Strategy",
          "timeframe": "mid-term",
          "expectedImpact": "Expanded reach and enhanced credibility among target audience."
        },
        {
          "title": "Create Exclusive Brand Programs",
          "description": `Develop tailored programs for customers, providing incentives for repeat engagement and fostering brand loyalty for ${monitoring_keyword}.`,
          "category": "Brand Strategy",
          "timeframe": "long-term",
          "expectedImpact": "Increased customer retention and positive brand association."
        },
        {
          "title": "Implement Mobile-Friendly Website Design",
          "description": `Optimize the website for mobile users to enhance user experience and accessibility, catering to the growing number of users accessing ${monitoring_keyword} via mobile devices.`,
          "category": "Technical Improvements",
          "timeframe": "immediate",
          "expectedImpact": "Higher conversion rates and improved customer satisfaction."
        }
      ];
    }

    // Final validation: Ensure proper limits based on page type
    console.log('🔍 OpenAI - Before validation - rankingAnalysis.length:', rankingAnalysis.length);
    console.log('🔍 OpenAI - Before validation - isSelectLocationPage:', isSelectLocationPage);
    
    if (isSelectLocationPage && rankingAnalysis.length > 20) {
      console.log('🔍 OpenAI - Limiting ranking analysis to 20 results for Select Location page (was', rankingAnalysis.length, ')');
      rankingAnalysis = rankingAnalysis.slice(0, 20);
    } else if (!isSelectLocationPage && rankingAnalysis.length > 5) {
      console.log('🔍 OpenAI - Limiting ranking analysis to 5 results for Results page (was', rankingAnalysis.length, ')');
      rankingAnalysis = rankingAnalysis.slice(0, 5);
    }
    
    console.log('🔍 OpenAI - After validation - rankingAnalysis.length:', rankingAnalysis.length);
    
    console.log('🔍 OpenAI - Final ranking analysis count:', rankingAnalysis.length);
    console.log('🔍 OpenAI - Final ranking analysis ranks:', rankingAnalysis.map(item => item.rank));

    const payload: OpenAIResultsResponse = { 
      text,
      rankingAnalysis,
      keywordPosition: keywordPosition > 0 ? keywordPosition : undefined,
      monitoringKeyword: monitoring_keyword,
      improvementRecommendations: improvementRecommendations.length > 0 ? improvementRecommendations : undefined
    };
    
    console.log('🔍 Final payload improvementRecommendations:', payload.improvementRecommendations?.length || 0);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};


