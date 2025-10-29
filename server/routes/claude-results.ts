import type { RequestHandler } from "express";
import type { ClaudeResultsRequest, ClaudeResultsResponse } from "@shared/api";
import https from "https";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

// Test basic connectivity to Anthropic API
async function testConnectivity(): Promise<boolean> {
  return new Promise((resolve) => {
    const urlObj = new URL(ANTHROPIC_API_URL);
    const req = https.request({
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: 'HEAD',
      timeout: 5000,
    }, (res) => {
      console.log('🔍 Connectivity test result:', res.statusCode);
      resolve(true);
    });

    req.on('error', (error) => {
      console.error('🔍 Connectivity test failed:', error.message);
      resolve(false);
    });

    req.on('timeout', () => {
      console.error('🔍 Connectivity test timed out');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Fallback function using native https module
function makeHttpsRequest(url: string, options: any, data: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: options.method || 'POST',
      headers: options.headers || {},
    };

    const req = https.request(requestOptions, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            ok: res.statusCode && res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(parsedData),
            text: () => Promise.resolve(responseData)
          });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

export const handleClaudeResults: RequestHandler = async (req, res) => {
  try {
    console.log('🔍 Claude handler - req.body:', req.body);
    console.log('🔍 Claude handler - req.method:', req.method);
    console.log('🔍 Claude handler - req.url:', req.url);
    console.log('🔍 Claude handler - req.headers:', req.headers);
    
    const { user_query, monitoring_keyword, page_type }: ClaudeResultsRequest = req.body ?? {};

    if (!process.env.ANTHROPIC_API_KEY) {
      res.status(500).json({ error: "Missing ANTHROPIC_API_KEY" });
      return;
    }

    if (!user_query || typeof user_query !== "string") {
      console.log('🔍 Claude handler - user_query validation failed:', { user_query, type: typeof user_query });
      res.status(400).json({ error: "user_query is required" });
      return;
    }

    // Determine if this is for Select Location page (20 results) or Results page (5 results)
    const isSelectLocationPage = page_type === 'select_location';
    console.log('🔍 Claude handler - page_type:', page_type);
    console.log('🔍 Claude handler - isSelectLocationPage:', isSelectLocationPage);
    
    let prompt: string;
    let maxTokens: number;
    
    if (isSelectLocationPage) {
      // Hotel location query - 20 results in 4 categories
      prompt = `Query: "${user_query}"

List 20 different items in 4 categories. Use real information.

**Best Items (5 results):**

1. Title: [Item Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [website name only]
IsHilton: [Yes if this is a Hilton hotel, No if not]

2. Title: [Item Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [website name only]
IsHilton: [Yes if this is a Hilton hotel, No if not]

3. Title: [Item Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [website name only]
IsHilton: [Yes if this is a Hilton hotel, No if not]

4. Title: [Item Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [website name only]
IsHilton: [Yes if this is a Hilton hotel, No if not]

5. Title: [Item Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [website name only]
IsHilton: [Yes if this is a Hilton hotel, No if not]

**Best Luxury Items (5 results):**

1. Title: [Item Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [website name only]
IsHilton: [Yes if this is a Hilton hotel, No if not]

2. Title: [Item Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [website name only]
IsHilton: [Yes if this is a Hilton hotel, No if not]

3. Title: [Item Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [website name only]
IsHilton: [Yes if this is a Hilton hotel, No if not]

4. Title: [Item Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [website name only]
IsHilton: [Yes if this is a Hilton hotel, No if not]

5. Title: [Item Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [website name only]
IsHilton: [Yes if this is a Hilton hotel, No if not]

**Best Business Items (5 results):**

1. Title: [Item Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [website name only]
IsHilton: [Yes if this is a Hilton hotel, No if not]

2. Title: [Item Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [website name only]
IsHilton: [Yes if this is a Hilton hotel, No if not]

3. Title: [Item Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [website name only]
IsHilton: [Yes if this is a Hilton hotel, No if not]

4. Title: [Item Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [website name only]
IsHilton: [Yes if this is a Hilton hotel, No if not]

5. Title: [Item Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [website name only]
IsHilton: [Yes if this is a Hilton hotel, No if not]

**Best Family Items (5 results):**

1. Title: [Item Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [website name only]
IsHilton: [Yes if this is a Hilton hotel, No if not]

2. Title: [Item Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [website name only]
IsHilton: [Yes if this is a Hilton hotel, No if not]

3. Title: [Item Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [website name only]
IsHilton: [Yes if this is a Hilton hotel, No if not]

4. Title: [Item Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [website name only]
IsHilton: [Yes if this is a Hilton hotel, No if not]

5. Title: [Item Name]
Description: [Brief description]
Rating: [X.X/5 if available]
Price: $[price if available]
Website: [website name only]
IsHilton: [Yes if this is a Hilton hotel, No if not]

CRITICAL HILTON DETECTION RULES:
- ONLY mark as "Yes" if the hotel name contains: "Hilton"
- Do NOT mark as "Yes" for: Marriott, Hyatt, Fairmont, Four Seasons, Ritz-Carlton, Westin, Sheraton, InterContinental, Holiday Inn, Best Western, or any other hotel chains
- If the hotel name does not contain any Hilton brand names, mark as "No"

Requirements:
- Provide exactly 20 items total (5 per category)
- Use real item names and information
- Use only domain names for websites (e.g., "example.com")`;
      maxTokens = 4000; // More tokens for 20 results + JSON
    } else {
      // Generic query - 5 results only
      prompt = `Query: "${user_query}"

Provide exactly 5 relevant results with real information. Use actual names, descriptions, and website URLs.

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
Website: [website name only]

3. Title: [Actual Product/Service Name]
Description: [Actual detailed description of the product/service]
Rating: [X.X/5 if available]
Price: $[price if available]
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

Requirements:
- Provide exactly 5 results
- Use real product/service names
- Write brief descriptions
- Use only domain names for websites (e.g., "marriott.com")`;
      maxTokens = 2000; // Standard tokens for 5 results
    }

    // For Select Location page, don't add JSON template - let server parsing handle it
    // This is similar to how Gemini works successfully
    if (isSelectLocationPage) {
      prompt += `\n\nIMPORTANT: Provide EXACTLY 20 items across all 4 categories. Do not skip any items.`;
    } else {
      prompt += `\n\nIMPORTANT: Provide EXACTLY 5 results. Do not skip any items.`;
    }

    console.log('🔍 Claude - Final prompt length:', prompt.length);
    console.log('🔍 Claude - Final prompt preview (last 1000 chars):', prompt.slice(-1000));

    // Test connectivity first
    console.log('🔍 Testing connectivity to Anthropic API...');
    const isConnected = await testConnectivity();
    if (!isConnected) {
      console.error('🔍 Connectivity test failed - there may be network issues');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
    
    let response;
    const requestBody = JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    });
    
    // Fallback request body with faster model
    const fallbackRequestBody = JSON.stringify({
      model: "claude-3-5-haiku-20241022", // Faster model
      max_tokens: Math.min(maxTokens, 1500), // Reduced tokens for faster response
      messages: [{ role: "user", content: prompt }],
    });
    
    const requestHeaders = {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    };
    
    try {
      console.log('🔍 Making Claude API request to:', ANTHROPIC_API_URL);
      console.log('🔍 Request headers:', {
        "x-api-key": process.env.ANTHROPIC_API_KEY ? `${process.env.ANTHROPIC_API_KEY.substring(0, 10)}...` : 'MISSING',
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      });
      console.log('🔍 Request body size:', requestBody.length);
      
      response = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        signal: controller.signal,
        headers: requestHeaders,
        body: requestBody,
      });
      clearTimeout(timeoutId);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        res.status(504).json({ error: 'Claude request timed out after 20 seconds' });
        return;
      }
      console.error('🔍 Claude fetch error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        cause: error.cause,
        stack: error.stack
      });
      
      // Try fallback with faster model first
      console.log('🔍 Trying fallback with faster model (Haiku)...');
      try {
        response = await fetch(ANTHROPIC_API_URL, {
          method: "POST",
          headers: requestHeaders,
          body: fallbackRequestBody,
        });
        console.log('🔍 Fallback with faster model succeeded');
      } catch (fallbackError: any) {
        console.error('🔍 Fallback with faster model failed:', {
          name: fallbackError.name,
          message: fallbackError.message,
          code: fallbackError.code,
        });
        
        // Try fallback with native https module
        console.log('🔍 Trying fallback with native https module...');
        try {
          response = await makeHttpsRequest(ANTHROPIC_API_URL, {
            method: "POST",
            headers: requestHeaders,
          }, fallbackRequestBody);
          console.log('🔍 Native https fallback succeeded');
        } catch (httpsError: any) {
          console.error('🔍 Native https fallback also failed:', {
            name: httpsError.name,
            message: httpsError.message,
            code: httpsError.code,
          });
          throw error; // Throw original error
        }
      }
    }

    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({ error: errText });
      return;
    }

    const data = (await response.json()) as { content?: Array<{ text?: string }> };
    const text = data?.content?.[0]?.text ?? "";
    
    console.log('🔍 Claude full response text:', text);
    console.log('🔍 Claude response contains improvement_recommendations:', text.includes('improvement_recommendations'));

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
    let rankingAnalysis = [];
    let improvementRecommendations = [];
    try {
      // Find the start of the JSON block
      const jsonStart = text.indexOf('{\n  "ranking_analysis":');
      if (jsonStart !== -1) {
        // Extract from the start to the end of the text (assuming JSON is at the end)
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
          console.log('🔍 Claude extracted JSON string:', jsonString);
          const analysisData = JSON.parse(jsonString);
          rankingAnalysis = analysisData.ranking_analysis || [];
          improvementRecommendations = analysisData.improvement_recommendations || [];
          console.log('🔍 Claude parsed ranking analysis:', rankingAnalysis);
          console.log('🔍 Claude ranking analysis count:', rankingAnalysis.length);
          console.log('🔍 Claude parsed improvement recommendations from main JSON:', improvementRecommendations);
          
          // Also try to extract improvement recommendations
          const improvementStart = text.indexOf('{\n  "improvement_recommendations":');
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
                console.log('🔍 Claude extracted improvement JSON:', improvementJsonString);
                const improvementData = JSON.parse(improvementJsonString);
                improvementRecommendations = improvementData.improvement_recommendations || [];
                console.log('🔍 Claude parsed improvement recommendations:', improvementRecommendations);
              } catch (e) {
                console.log('🔍 Claude failed to parse improvement recommendations:', e);
              }
            }
          }
        } else {
          // Try to extract partial JSON if it's truncated
          console.log('🔍 Claude JSON appears truncated, trying to extract partial data');
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
                console.log('🔍 Claude failed to parse partial analysis:', match[0]);
              }
            }
            console.log('🔍 Claude extracted partial ranking analysis:', rankingAnalysis);
          } catch (error) {
            console.log('🔍 Claude failed to extract partial JSON:', error);
          }
        }
      } else {
        console.log('🔍 Claude: No ranking_analysis JSON found in response');
        console.log('🔍 Claude response text preview:', text.substring(0, 500));
        
        // Create default ranking analysis for items found in text
        console.log('🔍 Creating default ranking analysis for items found in text');
        console.log('🔍 Claude response text length:', text.length);
        console.log('🔍 Claude response text preview:', text.substring(0, 1000));
        
        const itemMatchesAnalysis = text.matchAll(/(\d+)[\.)]\s*([\s\S]*?)(?=\n\s*\d+[\.)]\s|$)/g);
        const allMatchesAnalysis = Array.from(itemMatchesAnalysis);
        console.log('🔍 Claude found', allMatchesAnalysis.length, 'numbered items in response');
        
        // Always try category-based parsing for hotel results to ensure we get all categories
        console.log('🔍 Running category-based parsing for hotel results...');
        
        // Look for hotel categories and extract items from each (supporting both ** and === formats)
        const categoryMatches = text.matchAll(/(?:\*\*([^*]+)\*\*|=== ([^=]+) ===)[\s\S]*?(?=(?:\*\*[^*]+\*\*|=== [^=]+ ===)|$)/g);
        let categories = Array.from(categoryMatches);
        console.log('🔍 Claude found', categories.length, 'categories in response');
        
        // For SelectLocation page, use category parsing to get all 20 items
        if (isSelectLocationPage && categories.length > 0) {
          console.log('🔍 Claude - Using category parsing for SelectLocation page to ensure all 20 items');
          rankingAnalysis = []; // Clear existing ranking analysis
        } else if (!isSelectLocationPage) {
          console.log('🔍 Claude - Results page: Using simple parsing for first 5 items only');
          // For Results page, only process the first 5 items from the first category
          if (categories.length > 0) {
            const firstCategory = categories[0];
            const categoryContent = firstCategory[0];
            const categoryItemMatches = categoryContent.matchAll(/(\d+)[\.)]\s*([\s\S]*?)(?=\n\s*\d+[\.)]\s|$)/g);
            const categoryItems = Array.from(categoryItemMatches);
            
            // Only process first 5 items from first category
            for (let i = 0; i < Math.min(5, categoryItems.length); i++) {
              const itemMatch = categoryItems[i];
              const rank = parseInt(itemMatch[1]);
              const content = itemMatch[2].trim();
              const titleMatch = content.match(/Title:\s*([^\n]+)/i);
              const title = titleMatch?.[1]?.trim() || `Item ${rank}`;
              
              console.log('🔍 Adding item for Results page:', title, 'rank', rank);
              
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
              
              console.log('🔍 Claude - Content analysis:', {
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
                console.log('🔍 Claude - Added "detailed description available"');
              }
              if (ratingMatch && ratingMatch[1] && ratingMatch[1] !== "X.X/5 if available" && ratingMatch[1].trim().length > 0) {
                contextualSignals.push("rating information provided");
                console.log('🔍 Claude - Added "rating information provided"');
              }
              
              // Generate competitor presence from other items in the same category
              const competitorPresence = categoryItems
                .filter((_, index) => index !== categoryItems.indexOf(itemMatch))
                .slice(0, 3)
                .map(compMatch => {
                  const compContent = compMatch[2].trim();
                  const compTitleMatch = compContent.match(/Title:\s*([^\n]+)/i);
                  return compTitleMatch?.[1]?.trim() || "Unknown competitor";
                });
              
              const citationDomains = [];
              if (websiteMatch && websiteMatch[1] && websiteMatch[1] !== "website name only" && websiteMatch[1] !== "hotel website name only, e.g., \"marriott.com\" or \"hilton.com\"") {
                let website = websiteMatch[1].trim();
                // Clean up the website format
                website = website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
                if (website && website.length > 0) {
                  citationDomains.push(website);
                }
              }
              
              // Generate more specific reasoning based on rank and content
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
              if (websiteMatch && websiteMatch[1] !== "website name only") {
                reasoning += ` Available on ${websiteMatch[1].trim()}.`;
              }
              
              rankingAnalysis.push({
                provider: "claude",
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
          }
          // Skip the full category processing for Results page
          categories = []; // Clear categories to skip the full processing below
        }
        
        for (const categoryMatch of categories) {
          // Handle both ** and === formats - categoryText is in group 1 or 2
          const categoryText = categoryMatch[1] || categoryMatch[2];
          const categoryContent = categoryMatch[0];
          console.log('🔍 Processing category:', categoryText);
          console.log('🔍 Category content preview:', categoryContent.substring(0, 200));
          
          // Extract numbered items from this category
          const categoryItemMatches = categoryContent.matchAll(/(\d+)[\.)]\s*([\s\S]*?)(?=\n\s*\d+[\.)]\s|$)/g);
          const categoryItems = Array.from(categoryItemMatches);
          console.log('🔍 Category', categoryText, 'has', categoryItems.length, 'items');
          
          // Add these items to the main analysis (limit to 5 per category)
          for (const itemMatch of categoryItems) {
            const rank = parseInt(itemMatch[1]);
            if (rank > 5) {
              console.log('🔍 Claude - Stopping at rank', rank, 'to limit to 5 results per category');
              break; // Only process first 5 items per category
            }
            
            const content = itemMatch[2].trim();
            const titleMatch = content.match(/Title:\s*([^\n]+)/i);
            const title = titleMatch?.[1]?.trim() || `Item ${rank}`;
            
            console.log('🔍 Adding item from category', categoryText, ':', title, 'rank', rank);
            
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
            
            console.log('🔍 Claude - Main category content analysis:', {
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
              console.log('🔍 Claude - Main category: Added "detailed description available"');
            }
            if (ratingMatch && ratingMatch[1] && ratingMatch[1] !== "X.X/5 if available" && ratingMatch[1].trim().length > 0) {
              contextualSignals.push("rating information provided");
              console.log('🔍 Claude - Main category: Added "rating information provided"');
            }
            
            // Generate competitor presence from other items in the same category
            const competitorPresence = categoryItems
              .filter((_, index) => index !== categoryItems.indexOf(itemMatch))
              .slice(0, 3)
              .map(compMatch => {
                const compContent = compMatch[2].trim();
                const compTitleMatch = compContent.match(/Title:\s*([^\n]+)/i);
                return compTitleMatch?.[1]?.trim() || "Unknown competitor";
              });
            
            // Generate citation domains based on website information
            const citationDomains = [];
            if (websiteMatch && websiteMatch[1] && websiteMatch[1] !== "hotel website name only, e.g., \"marriott.com\" or \"hilton.com\"") {
              let website = websiteMatch[1].trim();
              // Clean up the website format
              website = website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
              if (website && website.length > 0) {
                citationDomains.push(website);
              }
            }
            
            // Generate more specific reasoning based on rank and category
            let reasoning = `Ranked #${rank} in ${categoryText} for the search query "${user_query}".`;
            if (rank === 1) {
              reasoning += ` Top choice in this category due to strong relevance and comprehensive information.`;
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
            if (websiteMatch && websiteMatch[1] !== "hotel website name only, e.g., \"marriott.com\" or \"hilton.com\"") {
              reasoning += ` Available on ${websiteMatch[1].trim()}.`;
            }
            
            rankingAnalysis.push({
              provider: "claude",
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
        }
        
        // Final validation: Ensure proper limits based on page type
        console.log('🔍 Claude - Before validation - rankingAnalysis.length:', rankingAnalysis.length);
        console.log('🔍 Claude - Before validation - isSelectLocationPage:', isSelectLocationPage);
        
        if (isSelectLocationPage) {
          if (rankingAnalysis.length > 20) {
            console.log('🔍 Claude - Limiting ranking analysis to 20 results for Select Location page (was', rankingAnalysis.length, ')');
            rankingAnalysis = rankingAnalysis.slice(0, 20);
          } else if (rankingAnalysis.length < 20) {
            console.log('🔍 Claude - Warning: Only', rankingAnalysis.length, 'results found for Select Location page (expected 20)');
          }
        } else {
          // Results page - ensure exactly 5 results
          if (rankingAnalysis.length > 5) {
            console.log('🔍 Claude - Limiting ranking analysis to 5 results for Results page (was', rankingAnalysis.length, ')');
            rankingAnalysis = rankingAnalysis.slice(0, 5);
          } else if (rankingAnalysis.length < 5) {
            console.log('🔍 Claude - Warning: Only', rankingAnalysis.length, 'results found for Results page (expected 5)');
          }
        }
        
        console.log('🔍 Claude - After validation - rankingAnalysis.length:', rankingAnalysis.length);
        
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
      console.error('Claude failed to parse ranking analysis:', error);
      console.error('Claude error details:', error);
    }

    // Ensure we always have some ranking analysis, even if parsing failed
    if (rankingAnalysis.length === 0) {
      console.log('🔍 No ranking analysis found, creating fallback...');
      console.log('🔍 Claude fallback - response text length:', text.length);
      console.log('🔍 Claude fallback - response text preview:', text.substring(0, 1000));
      
      const itemMatchesAnalysis = text.matchAll(/(\d+)[\.)]\s*([\s\S]*?)(?=\n\s*\d+[\.)]\s|$)/g);
      const allMatchesAnalysis = Array.from(itemMatchesAnalysis);
      console.log('🔍 Claude fallback - found', allMatchesAnalysis.length, 'numbered items in response');
      
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
        
        console.log('🔍 Claude - Fallback content analysis:', {
          title,
          hasDescription: !!descriptionMatch,
          hasWebsite: !!websiteMatch,
          hasRating: !!ratingMatch,
          descriptionText: descriptionMatch?.[1]?.substring(0, 50),
          ratingText: ratingMatch?.[1]?.substring(0, 20)
        });
        
        const citationDomains = [];
        if (websiteMatch && websiteMatch[1] && websiteMatch[1] !== "website name only" && websiteMatch[1] !== "hotel website name only, e.g., \"marriott.com\" or \"hilton.com\"") {
          let website = websiteMatch[1].trim();
          // Clean up the website format
          website = website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
          if (website && website.length > 0) {
            citationDomains.push(website);
          }
        }
        
        // Extract location from user_query for cleaner reasoning
        const locationMatch = user_query.match(/List 20 different hotels in ([^in]+) in 4 categories/);
        const location = locationMatch ? locationMatch[1].trim() : "the specified location";
        
        // Extract meaningful keywords from the user query
        const queryWords = user_query.toLowerCase().split(/\s+/).filter(word => 
          word.length > 2 && !['the', 'and', 'or', 'in', 'of', 'for', 'with', 'to'].includes(word)
        );
        const matchedKeywords = [...queryWords];
        if (title.toLowerCase().includes(user_query.toLowerCase())) {
          matchedKeywords.push(title.toLowerCase());
        }
        
        // Generate competitor presence from other items
        const competitorPresence = allMatchesAnalysis
          .filter((_, index) => index !== allMatchesAnalysis.indexOf(match))
          .slice(0, 3)
          .map(compMatch => {
            const compContent = compMatch[2].trim();
            const compTitleMatch = compContent.match(/Title:\s*([^\n]+)/i);
            return compTitleMatch?.[1]?.trim() || "Unknown competitor";
          });
        
        // Generate contextual signals based on available information
        const contextualSignals = ["search relevance", "user query match"];
        if (descriptionMatch && descriptionMatch[1] && descriptionMatch[1].trim().length > 0) {
          contextualSignals.push("detailed description available");
          console.log('🔍 Claude - Fallback: Added "detailed description available"');
        }
        if (ratingMatch && ratingMatch[1] && ratingMatch[1] !== "X.X/5 if available" && ratingMatch[1].trim().length > 0) {
          contextualSignals.push("rating information provided");
          console.log('🔍 Claude - Fallback: Added "rating information provided"');
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
        
        rankingAnalysis.push({
          provider: "claude",
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
    
    // Debug: Log ranking analysis status
    console.log('🔍 Final ranking analysis check:');
    console.log('🔍 rankingAnalysis.length:', rankingAnalysis.length);
    console.log('🔍 rankingAnalysis ranks:', rankingAnalysis.map(item => item.rank));
    
    // Log ranking analysis status (but don't create missing ranks)
    if (rankingAnalysis.length < 5) {
      console.log('ℹ️ Claude provided', rankingAnalysis.length, 'ranking analysis items');
    } else {
      console.log('✅ Claude provided all 5 ranking analysis items');
    }
    
    console.log('🔍 Claude - Final ranking analysis count:', rankingAnalysis.length);
    console.log('🔍 Claude - Final ranking analysis ranks:', rankingAnalysis.map(item => item.rank));
    
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

    const payload: ClaudeResultsResponse = { 
      text,
      rankingAnalysis,
      keywordPosition: keywordPosition > 0 ? keywordPosition : undefined,
      monitoringKeyword: monitoring_keyword,
      improvementRecommendations: improvementRecommendations.length > 0 ? improvementRecommendations : undefined
    };
    
    console.log('🔍 Final payload improvementRecommendations:', payload.improvementRecommendations?.length || 0);
    res.json(payload);
  } catch (error) {
    console.error('🔍 Claude handler error:', {
      name: (error as Error).name,
      message: (error as Error).message,
      code: (error as any).code,
      cause: (error as any).cause,
      stack: (error as Error).stack
    });
    res.status(500).json({ 
      error: (error as Error).message,
      details: {
        name: (error as Error).name,
        code: (error as any).code
      }
    });
  }
};


