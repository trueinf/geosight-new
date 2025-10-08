import type { RequestHandler } from "express";
import type { PerplexityResultsRequest, PerplexityResultsResponse, RankingAnalysisResponse } from "@shared/api";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Helper function to extract location from user query
function extractLocationFromQuery(user_query: string): string {
  const locationMatch = user_query.match(/List 20 different hotels in ([^in]+) in 4 categories/);
  return locationMatch ? locationMatch[1].trim() : "the specified location";
}

export const handlePerplexityResults: RequestHandler = async (req, res) => {
  try {
    const { user_query, monitoring_keyword, page_type }: PerplexityResultsRequest = req.body ?? {};

    if (!user_query || typeof user_query !== "string") {
      res.status(400).json({ error: "user_query is required" });
      return;
    }

    // Check API key availability
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('❌ OPENROUTER_API_KEY is not set in environment variables');
      res.status(500).json({ 
        error: "Missing OPENROUTER_API_KEY",
        message: "Perplexity API key is not configured. Please add OPENROUTER_API_KEY to your environment variables.",
        details: "Get your API key from https://openrouter.ai/keys"
      });
      return;
    }
    
    console.log('✅ OPENROUTER_API_KEY is set, length:', process.env.OPENROUTER_API_KEY.length);

    // Determine if this is for Select Location page (20 results) or Results page (5 results)
    const isSelectLocationPage = page_type === 'select_location';
    const expectedItems = isSelectLocationPage ? 20 : 5;
    
    let prompt: string;
    let maxTokens: number;
    
    if (isSelectLocationPage) {
      // Hotel location query - 20 results in 4 categories
      prompt = `Query: "${user_query}"

You MUST respond with EXACTLY this format. Use REAL hotel information. Do NOT use placeholder text like [Actual Hotel Name] or [Brief description]. Use actual hotel names, descriptions, and website URLs.

**Best Hotels (5 results):**

1. Title: [Actual Hotel Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

2. Title: [Actual Hotel Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

3. Title: [Actual Hotel Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

4. Title: [Actual Hotel Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

5. Title: [Actual Hotel Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

**Best Luxury Hotels (5 results):**

1. Title: [Actual Hotel Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

2. Title: [Actual Hotel Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

3. Title: [Actual Hotel Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

4. Title: [Actual Hotel Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

5. Title: [Actual Hotel Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

**Best Business Hotels (5 results):**

1. Title: [Actual Hotel Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

2. Title: [Actual Hotel Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

3. Title: [Actual Hotel Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

4. Title: [Actual Hotel Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

5. Title: [Actual Hotel Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

**Best Family Hotels (5 results):**

1. Title: [Actual Hotel Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

2. Title: [Actual Hotel Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

3. Title: [Actual Hotel Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

4. Title: [Actual Hotel Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

5. Title: [Actual Hotel Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

CRITICAL HILTON DETECTION RULES:
- ONLY mark as "Yes" if the hotel name contains: "Hilton"
- Do NOT mark as "Yes" for: Marriott, Hyatt, Fairmont, Four Seasons, Ritz-Carlton, Westin, Sheraton, InterContinental, Holiday Inn, Best Western, or any other hotel chains
- If the hotel name does not contain any Hilton brand names, mark as "No"

ABSOLUTE REQUIREMENTS:
- Your response MUST start with "**Best Hotels (5 results):**"
- You MUST include all 4 category headers exactly as shown above
- You MUST provide exactly 5 items under each category
- Use REAL hotel names, not placeholders
- Do NOT add any introductory text
- Do NOT add any concluding text
- Do NOT deviate from this format
- CRITICAL: Organize your response into 4 distinct categories with 5 hotels each. Do NOT return a flat list of 20 hotels.

IMPORTANT: 
- Replace ALL placeholder text with real hotel information
- Provide actual hotel names from real establishments
- Write detailed descriptions (at least 2-3 sentences about amenities, location, features)
- For Website field: Use ONLY the domain name (e.g., "marriott.com", "hilton.com") - NO full URLs or HTML links
- Use real ratings and prices when known
- Return EXACTLY 5 items per category.

REMEMBER: You must organize your response into 4 categories:
1. **Best Hotels (5 results):** - 5 hotels
2. **Best Luxury Hotels (5 results):** - 5 different luxury hotels  
3. **Best Business Hotels (5 results):** - 5 different business hotels
4. **Best Family Hotels (5 results):** - 5 different family hotels

Total: 20 unique hotels across 4 categories.

START YOUR RESPONSE NOW WITH: "**Best Hotels (5 results):**"`;
      maxTokens = 800; // Increased for better responses
    } else {
      // Generic query - 5 results only
      prompt = `Query: "${user_query}"

Provide exactly 5 relevant results with REAL information. Do NOT use placeholder text like [Item Name] or [Brief description]. Use actual names, descriptions, and website URLs.

Format each result exactly like this:

1. Title: [Actual Product/Service Name]
Description: [Actual detailed description of the product/service]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [website name only, e.g., "brooksrunning.com" or "saucony.com"]

2. Title: [Actual Product/Service Name]
Description: [Actual detailed description of the product/service]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [website name only, e.g., "brooksrunning.com" or "saucony.com"]

3. Title: [Actual Product/Service Name]
Description: [Actual detailed description of the product/service]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [website name only, e.g., "brooksrunning.com" or "saucony.com"]

4. Title: [Actual Product/Service Name]
Description: [Actual detailed description of the product/service]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [website name only, e.g., "brooksrunning.com" or "saucony.com"]

5. Title: [Actual Product/Service Name]
Description: [Actual detailed description of the product/service]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [website name only, e.g., "brooksrunning.com" or "saucony.com"]

IMPORTANT: 
- Replace ALL placeholder text with real information
- Provide actual product/service names
- Write detailed descriptions (at least 1-2 sentences)
- For Website field: Use ONLY the domain name (e.g., "brooksrunning.com", "saucony.com") - NO full URLs or HTML links
- Use real ratings and prices when known`;
      maxTokens = 600; // Increased for better responses
    }

    // Simplified prompt for faster response
    prompt += `

IMPORTANT: Provide EXACTLY ${expectedItems} items. Keep response concise and fast.`;

    // Create multiple timeout layers to prevent 504 errors
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    let response;
    let text = "";
    
    try {
      console.log('🔍 Making Perplexity API request with model: gpt-4o-mini');
      console.log('🔍 Request body:', JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt.substring(0, 200) + "..." }],
        max_tokens: maxTokens,
      }, null, 2));
      
      // Create a race between the API call and a quick fallback
      const quickFallbackPromise = new Promise((resolve) => {
        setTimeout(() => {
          console.log('🔍 Perplexity API taking too long, using fallback response');
          resolve({
            choices: [{
              message: {
                content: `I apologize, but I'm currently experiencing high demand and cannot provide a complete response for your query: "${user_query}". 

Please try again in a few moments, or consider using one of the other AI providers available. The system is working to resolve this issue.`
              }
            }]
          });
        }, 12000); // 12 second fallback
      });
      
      const apiPromise = fetch(OPENROUTER_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": process.env.SITE_URL || "https://geosight.app",
          "X-Title": process.env.SITE_NAME || "GeoSight",
          "Content-Type": "application/json",
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
        }),
      });
      
      response = await Promise.race([apiPromise, quickFallbackPromise]) as Response;
      clearTimeout(timeoutId);
      
      console.log('🔍 Perplexity API response status:', response.status, response.statusText);
      
      // Handle fallback response (not a real HTTP response)
      if (!response.ok && response.status === undefined) {
        const json = response as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        text = json?.choices?.[0]?.message?.content ?? "";
        console.log('🔍 Using fallback response');
      } else if (!response.ok) {
        const errText = await response.text();
        console.error('❌ Perplexity API error:', response.status, errText);
        res.status(response.status).json({ error: errText });
        return;
      } else {
        const json = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        text = json?.choices?.[0]?.message?.content ?? "";
      }
      
      if (!text || text.trim().length === 0) {
        console.error('❌ Perplexity returned empty response');
        // Return a fallback response with proper ranking analysis
        const fallbackText = `I apologize, but I'm currently experiencing high demand and cannot provide a complete response for your query: "${user_query}". Please try again in a few moments, or consider using one of the other AI providers available.`;

        // Create proper ranking analysis for fallback - generate 5 items based on the query
        const fallbackRankingAnalysis: RankingAnalysisResponse[] = [];
        const queryWords = user_query.toLowerCase().split(' ').filter(word => word.length > 2);
        
        for (let i = 1; i <= 5; i++) {
          let targetName = '';
          if (user_query.toLowerCase().includes('cruise')) {
            const cruiseLines = ['Royal Caribbean', 'Carnival Cruise Line', 'Norwegian Cruise Line', 'Princess Cruises', 'Disney Cruise Line'];
            targetName = cruiseLines[i - 1] || `Cruise Option ${i}`;
          } else if (user_query.toLowerCase().includes('hotel')) {
            const hotelChains = ['Hilton', 'Marriott', 'Hyatt', 'InterContinental', 'Radisson'];
            targetName = hotelChains[i - 1] || `Hotel Option ${i}`;
          } else {
            targetName = `${user_query} Option ${i}`;
          }
          
          fallbackRankingAnalysis.push({
            provider: "perplexity",
            target: targetName,
            rank: i,
            matched_keywords: queryWords,
            contextual_signals: ["search relevance", "user query match", "fallback response"],
            competitor_presence: fallbackRankingAnalysis.map(item => item.target),
            sentiment: "positive",
            citation_domains: ["example.com"],
            llm_reasoning: `Ranked #${i} based on relevance to "${user_query}". This is a fallback response due to API timeout.`
          });
        }

        const payload: PerplexityResultsResponse = { 
          text: fallbackText,
          rankingAnalysis: fallbackRankingAnalysis,
          keywordPosition: undefined,
          monitoringKeyword: monitoring_keyword,
          improvementRecommendations: undefined
        };
        res.json(payload);
        return;
      }
      
      // Debug: Log the raw response text to see what Perplexity is actually returning
      console.log('🔍 PERPLEXITY RAW RESPONSE TEXT:');
      console.log('='.repeat(50));
      console.log(text);
      console.log('='.repeat(50));
      console.log('🔍 TEXT LENGTH:', text.length);
      
      // Count numbered items in the response
      const itemMatches = text.matchAll(/(\d+)[\.)]\s*/g);
      const allMatches = Array.from(itemMatches);
      console.log('🔍 NUMBERED ITEMS FOUND IN RESPONSE:', allMatches.length, allMatches.map(m => m[1]));
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error('❌ Perplexity request timed out after 5 seconds');
        // Return proper error response instead of fallback data
        res.status(408).json({ 
          error: 'Perplexity API timeout', 
          message: 'The Perplexity API request timed out. Please try again.' 
        });
        return;
      }
      console.error('❌ Perplexity API error:', error);
      // Return proper error response instead of fallback data
      res.status(500).json({ 
        error: 'Perplexity API error', 
        message: 'Failed to fetch data from Perplexity API. Please try again.' 
      });
      return;
    }

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
    
    console.log('🔍 Starting ranking analysis extraction...');
    console.log('🔍 Text length:', text.length);
    console.log('🔍 Text preview:', text.substring(0, 500));
    
    try {
      // Look for JSON block with ranking_analysis
      const jsonPattern = /\{\s*"ranking_analysis"\s*:/;
      const jsonMatch = text.match(jsonPattern);
      console.log('🔍 JSON pattern match found:', !!jsonMatch);
      
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
          const analysisData = JSON.parse(jsonString);
          rankingAnalysis = analysisData.ranking_analysis || [];
          improvementRecommendations = analysisData.improvement_recommendations || [];
          console.log('🔍 Perplexity parsed improvement recommendations from main JSON:', improvementRecommendations);
        }
      } else {
        console.log('🔍 Perplexity: No ranking_analysis JSON found in response');
        console.log('🔍 Perplexity response text preview:', text.substring(0, 500));
        
        // Create default ranking analysis for items found in text
        console.log('🔍 Creating default ranking analysis for items found in text');
        const itemMatchesAnalysis = text.matchAll(/(\d+)[\.)]\s*([\s\S]*?)(?=\n\s*\d+[\.)]\s|$)/g);
        const allMatchesAnalysis = Array.from(itemMatchesAnalysis);
        
        for (const match of allMatchesAnalysis) {
          const rank = parseInt(match[1]);
          if (rank > 5) break; // Only process first 5 items
          
          const content = match[2].trim();
          const titleMatch = content.match(/Title:\s*([^\n]+)/i);
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
          
          console.log('🔍 Perplexity - Content analysis:', {
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
            console.log('🔍 Perplexity - Added "detailed description available"');
          }
          if (ratingMatch && ratingMatch[1] && ratingMatch[1] !== "X.X/5 if available" && ratingMatch[1].trim().length > 0) {
            contextualSignals.push("rating information provided");
            console.log('🔍 Perplexity - Added "rating information provided"');
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
            provider: "perplexity",
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
    }

    // Ensure we always have some ranking analysis, even if parsing failed
    if (rankingAnalysis.length === 0) {
      console.log('🔍 No ranking analysis found, creating fallback...');
      const itemMatchesAnalysis = text.matchAll(/(\d+)[\.)]\s*([\s\S]*?)(?=\n\s*\d+[\.)]\s|$)/g);
      const allMatchesAnalysis = Array.from(itemMatchesAnalysis);
      
      for (const match of allMatchesAnalysis) {
        const rank = parseInt(match[1]);
        if (rank > 5) break; // Only process first 5 items
        
        const content = match[2].trim();
        // Handle both "Title:" and "**Title:**" formats
        let titleMatch = content.match(/\*\*Title:\s*([^*]+)\*\*/i);
        if (!titleMatch) {
          titleMatch = content.match(/Title:\s*([^\n]+)/i);
        }
        const title = titleMatch?.[1]?.trim() || `Item ${rank}`;
        
        rankingAnalysis.push({
          provider: "perplexity",
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
    console.log('🔍 improvementRecommendations:', improvementRecommendations);
    
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

    // Final validation: Ensure proper limits based on page type
    if (isSelectLocationPage) {
      if (rankingAnalysis.length > 20) {
        console.log('🔍 Perplexity - Limiting ranking analysis to 20 results for Select Location page (was', rankingAnalysis.length, ')');
        rankingAnalysis = rankingAnalysis.slice(0, 20);
      } else if (rankingAnalysis.length < 20) {
        console.log('🔍 Perplexity - Warning: Only', rankingAnalysis.length, 'results found for Select Location page (expected 20)');
      }
    } else if (!isSelectLocationPage && rankingAnalysis.length > 5) {
      console.log('🔍 Perplexity - Limiting ranking analysis to 5 results for Results page');
      rankingAnalysis = rankingAnalysis.slice(0, 5);
    }

    console.log('🔍 Perplexity - Final ranking analysis count:', rankingAnalysis.length);
    console.log('🔍 Perplexity - Final ranking analysis ranks:', rankingAnalysis.map(item => item.rank));

    const payload: PerplexityResultsResponse = { 
      text,
      rankingAnalysis,
      keywordPosition: keywordPosition > 0 ? keywordPosition : undefined,
      monitoringKeyword: monitoring_keyword,
      improvementRecommendations: improvementRecommendations.length > 0 ? improvementRecommendations : undefined
    };
    
    console.log('🔍 Final payload improvementRecommendations:', payload.improvementRecommendations?.length || 0);
    res.json(payload);
    
  } catch (error) {
    console.error("Perplexity fallback error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
};