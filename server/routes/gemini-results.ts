import type { RequestHandler } from "express";
import type { GeminiResultsRequest, GeminiResultsResponse, RankingAnalysisResponse } from "@shared/api";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent";

export const handleGeminiResults: RequestHandler = async (req, res) => {
  try {
    const { user_query, monitoring_keyword, page_type }: GeminiResultsRequest = req.body ?? {};

    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY is not set in environment variables');
      res.status(500).json({ error: "Missing GEMINI_API_KEY" });
      return;
    }
    
    console.log('✅ GEMINI_API_KEY is set, length:', process.env.GEMINI_API_KEY.length);

    if (!user_query || typeof user_query !== "string") {
      res.status(400).json({ error: "user_query is required" });
      return;
    }

    // Determine if this is for Select Location page (20 results) or Results page (10 results)
    const isSelectLocationPage = page_type === 'select_location';
    
    let prompt: string;
    let maxTokens: number;
    
    if (isSelectLocationPage) {
      // Hotel location query - 20 results in 4 categories
      prompt = `Query: "${user_query}"

Provide exactly 20 hotels in 4 categories (5 each) with REAL information. Do NOT use placeholder text. Use actual hotel names, descriptions, and website URLs.

**Best Hotels (5 results):**
1. Title: [Actual Hotel Name]
Description: [Actual detailed description of the hotel, amenities, and location]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

2. Title: [Actual Hotel Name]
Description: [Actual detailed description of the hotel, amenities, and location]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

3. Title: [Actual Hotel Name]
Description: [Actual detailed description of the hotel, amenities, and location]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

4. Title: [Actual Hotel Name]
Description: [Actual detailed description of the hotel, amenities, and location]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

5. Title: [Actual Hotel Name]
Description: [Actual detailed description of the hotel, amenities, and location]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

**Best Luxury Hotels (5 results):**
1. Title: [Actual Luxury Hotel Name]
Description: [Actual detailed description of the luxury hotel, premium amenities, and location]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

2. Title: [Actual Luxury Hotel Name]
Description: [Actual detailed description of the luxury hotel, premium amenities, and location]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

3. Title: [Actual Luxury Hotel Name]
Description: [Actual detailed description of the luxury hotel, premium amenities, and location]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

4. Title: [Actual Luxury Hotel Name]
Description: [Actual detailed description of the luxury hotel, premium amenities, and location]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

5. Title: [Actual Luxury Hotel Name]
Description: [Actual detailed description of the luxury hotel, premium amenities, and location]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

**Best Business Hotels (5 results):**
1. Title: [Actual Business Hotel Name]
Description: [Actual detailed description of the business hotel, business amenities, and location]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

2. Title: [Actual Business Hotel Name]
Description: [Actual detailed description of the business hotel, business amenities, and location]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

3. Title: [Actual Business Hotel Name]
Description: [Actual detailed description of the business hotel, business amenities, and location]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

4. Title: [Actual Business Hotel Name]
Description: [Actual detailed description of the business hotel, business amenities, and location]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]  
IsHilton: [Yes if this is a Hilton hotel, No if not]

5. Title: [Actual Business Hotel Name]
Description: [Actual detailed description of the business hotel, business amenities, and location]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

**Best Family Hotels (5 results):**
1. Title: [Actual Family Hotel Name]
Description: [Actual detailed description of the family hotel, family amenities, and location]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

2. Title: [Actual Family Hotel Name]
Description: [Actual detailed description of the family hotel, family amenities, and location]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

3. Title: [Actual Family Hotel Name]
Description: [Actual detailed description of the family hotel, family amenities, and location]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]


4. Title: [Actual Family Hotel Name]
Description: [Actual detailed description of the family hotel, family amenities, and location]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

5. Title: [Actual Family Hotel Name]
Description: [Actual detailed description of the family hotel, family amenities, and location]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [hotel website name only, e.g., "marriott.com" or "hilton.com"]
IsHilton: [Yes if this is a Hilton hotel, No if not]

IMPORTANT: 
- Replace ALL placeholder text with real hotel information
- Provide actual hotel names from real establishments
- Write detailed descriptions (at least 2-3 sentences about amenities, location, features)
- For Website field: Use ONLY the domain name (e.g., "marriott.com", "hilton.com") - NO full URLs or HTML links
- Use real ratings and prices when known
- Return EXACTLY 5 items per category.

CRITICAL HILTON DETECTION RULES:
- ONLY mark as "Yes" if the hotel name contains: "Hilton"
- Do NOT mark as "Yes" for: Marriott, Hyatt, Fairmont, Four Seasons, Ritz-Carlton, Westin, Sheraton, InterContinental, Holiday Inn, Best Western, or any other hotel chains
- If the hotel name does not contain any Hilton brand names, mark as "No"`;
      maxTokens = 5000; // Increased to accommodate better responses
    } else {
      // Generic query - 10 results only
      prompt = `Query: "${user_query}"

Provide exactly 10 relevant results with REAL information. Do NOT use placeholder text like [Item Name] or [Brief description]. Use actual names, descriptions, and website URLs.

Format each result exactly like this:

1. Title: [Actual Product/Service Name]
Description: [Actual detailed description of the product/service]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [website name only, e.g., "brooksrunning.com" or "saucony.com"]
Major Reviews: [Up to 10 major review sites/platforms, comma-separated. Examples: "Yelp, TripAdvisor, Google Reviews, Booking.com, Expedia"]

2. Title: [Actual Product/Service Name]
Description: [Actual detailed description of the product/service]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [website name only, e.g., "brooksrunning.com" or "saucony.com"]
Major Reviews: [Up to 10 major review sites/platforms, comma-separated]

3. Title: [Actual Product/Service Name]
Description: [Actual detailed description of the product/service]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [website name only, e.g., "brooksrunning.com" or "saucony.com"]
Major Reviews: [Up to 10 major review sites/platforms, comma-separated]

4. Title: [Actual Product/Service Name]
Description: [Actual detailed description of the product/service]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [website name only, e.g., "brooksrunning.com" or "saucony.com"]
Major Reviews: [Up to 10 major review sites/platforms, comma-separated]

5. Title: [Actual Product/Service Name]
Description: [Actual detailed description of the product/service]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [website name only, e.g., "brooksrunning.com" or "saucony.com"]
Major Reviews: [Up to 10 major review sites/platforms, comma-separated]

6. Title: [Actual Product/Service Name]
Description: [Actual detailed description of the product/service]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [website name only, e.g., "brooksrunning.com" or "saucony.com"]
Major Reviews: [Up to 10 major review sites/platforms, comma-separated]

7. Title: [Actual Product/Service Name]
Description: [Actual detailed description of the product/service]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [website name only, e.g., "brooksrunning.com" or "saucony.com"]
Major Reviews: [Up to 10 major review sites/platforms, comma-separated]

8. Title: [Actual Product/Service Name]
Description: [Actual detailed description of the product/service]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [website name only, e.g., "brooksrunning.com" or "saucony.com"]
Major Reviews: [Up to 10 major review sites/platforms, comma-separated]

9. Title: [Actual Product/Service Name]
Description: [Actual detailed description of the product/service]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [website name only, e.g., "brooksrunning.com" or "saucony.com"]
Major Reviews: [Up to 10 major review sites/platforms, comma-separated]

10. Title: [Actual Product/Service Name]
Description: [Actual detailed description of the product/service]
Rating: [X.X/5 if available]
Price: $[actual price if available]
Website: [website name only, e.g., "brooksrunning.com" or "saucony.com"]
Major Reviews: [Up to 10 major review sites/platforms, comma-separated]

IMPORTANT: 
- Replace ALL placeholder text with real information
- Provide actual product/service names
- Write detailed descriptions (at least 1-2 sentences)
- For Website field: Use ONLY the domain name (e.g., "brooksrunning.com", "saucony.com") - NO full URLs or HTML links
- Use real ratings and prices when known
- Provide EXACTLY 10 total results.`;
      maxTokens = 2600; // Increased slightly to accommodate 10 results
    }

    async function callGemini(url: string) {
      const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
      
      try {
        console.log(`🔍 Making request to: ${url}`);
        console.log(`🔍 API Key length: ${process.env.GEMINI_API_KEY?.length}`);
        console.log(`🔍 Prompt length: ${prompt.length}`);
        
        const response = await fetch(url, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3, // Slightly higher for more creative, detailed responses
              maxOutputTokens: maxTokens,
              topP: 0.9, // Higher topP for more diverse responses
              topK: 40, // Higher topK for better quality
            },
          }),
        });
        
        console.log(`🔍 Response status: ${response.status}`);
        clearTimeout(timeoutId);
        return response;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Gemini request timed out after 20 seconds');
        }
        throw error;
      }
    }

    // Use faster models to prevent timeouts
    const modelUrls = [
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent", // Fastest model first
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", // Fallback
    ];

    let resp;
    let geminiError = null;

    try {
      // Try multiple models quickly
      for (let i = 0; i < modelUrls.length; i++) {
        try {
          console.log(`🔍 Trying Gemini model ${i + 1}/${modelUrls.length}`);
          resp = await callGemini(modelUrls[i]);
          
          if (resp.ok) {
            console.log(`✅ Gemini model ${i + 1} succeeded`);
            break;
          } else {
            console.log(`❌ Gemini model ${i + 1} failed: ${resp.status}`);
            if (i < modelUrls.length - 1) {
              await new Promise((r) => setTimeout(r, 200)); // Quick retry
            }
          }
        } catch (modelError: any) {
          console.log(`❌ Gemini model ${i + 1} error:`, modelError.message);
          console.log(`❌ Gemini model ${i + 1} full error:`, modelError);
          if (i < modelUrls.length - 1) {
            await new Promise((r) => setTimeout(r, 200)); // Quick retry
          }
        }
      }
      
      if (!resp || !resp.ok) {
        const text = resp ? await resp.text() : 'No response';
        console.error('❌ All Gemini models failed');
        geminiError = { 
          error: "Gemini request failed", 
          details: "All models failed or timed out"
        };
      }
    } catch (error: any) {
      console.error('❌ Gemini request error:', error);
      geminiError = { 
        error: "Gemini request failed", 
        details: error.message || "API request failed"
      };
    }

    // If Gemini fails, return a fallback response instead of erroring
    if (geminiError) {
      console.log('⚠️ Gemini failed, returning fallback response');
      const fallbackText = `I apologize, but I'm currently experiencing technical difficulties and cannot provide a complete response for your query: "${user_query}". 

Please try again in a few moments, or consider using one of the other AI providers available.`;

      const payload: GeminiResultsResponse = { 
        text: fallbackText,
        rankingAnalysis: [],
        keywordPosition: undefined,
        monitoringKeyword: monitoring_keyword,
        improvementRecommendations: undefined
      };
      res.json(payload);
      return;
    }

    const json = (await resp.json()) as any;

    // Try multiple shapes for compatibility
    let text: string = "";
    const cand0 = json?.candidates?.[0];
    if (cand0?.content?.parts?.[0]?.text) text = cand0.content.parts[0].text as string;
    else if (Array.isArray(cand0?.content) && cand0.content[0]?.parts?.[0]?.text) text = cand0.content[0].parts[0].text as string;
    else if (cand0?.content?.parts && typeof cand0.content.parts === 'string') text = cand0.content.parts as string;

    if (!text || typeof text !== 'string') {
      res.status(502).json({ error: "Gemini returned no text", details: { finishReason: cand0?.finishReason, safetyRatings: cand0?.safetyRatings } });
      return;
    }

    // Debug: Log the raw response text to see what Gemini is actually returning
    console.log('🔍 GEMINI RAW RESPONSE TEXT:');
    console.log('='.repeat(50));
    console.log(text);
    console.log('='.repeat(50));
    console.log('🔍 TEXT LENGTH:', text.length);
    
    // Count numbered items in the response
    const itemMatchesCount = text.matchAll(/(\d+)[\.)]\s*/g);
    const allMatchesCount = Array.from(itemMatchesCount);
    console.log('🔍 NUMBERED ITEMS FOUND IN RESPONSE:', allMatchesCount.length, allMatchesCount.map(m => m[1]));

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

    // Simplified JSON parsing for faster processing
    let rankingAnalysis: RankingAnalysisResponse[] = [];
    let improvementRecommendations = [];
    
    // Create default ranking analysis for items found in text
    const itemMatchesAnalysis = text.matchAll(/(\d+)[\.)]\s*([\s\S]*?)(?=\n\s*\d+[\.)]\s|$)/g);
    const allMatchesAnalysis = Array.from(itemMatchesAnalysis);
    
    for (const match of allMatchesAnalysis) {
      const rank = parseInt(match[1]);
      if (rank > 10 && !isSelectLocationPage) break; // Only process first 10 items for Results page
      
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
      const majorReviewsMatch = content.match(/Major Reviews:\s*([^\n]+)/i) ||
                                content.match(/Major Reviews\s*:\s*([^\n]+)/i) ||
                                content.match(/\*\*Major Reviews:\s*([^*]+)\*\*/i);
      
      console.log('🔍 Gemini - Content analysis:', {
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
        console.log('🔍 Gemini - Added "detailed description available"');
      }
      if (ratingMatch && ratingMatch[1] && ratingMatch[1] !== "X.X/5 if available" && ratingMatch[1].trim().length > 0) {
        contextualSignals.push("rating information provided");
        console.log('🔍 Gemini - Added "rating information provided"');
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
      
      const majorReviews = majorReviewsMatch && majorReviewsMatch[1]
        ? majorReviewsMatch[1]
            .split(',')
            .map(r => r.replace(/^["'\s]+|["'\s]+$/g, ''))
            .filter(r => r)
            .slice(0, 10)
        : undefined;
      
      rankingAnalysis.push({
        provider: "gemini",
        target: title,
        rank: rank,
        matched_keywords: matchedKeywords,
        contextual_signals: contextualSignals,
        competitor_presence: competitorPresence,
        sentiment: "positive",
        citation_domains: citationDomains,
        llm_reasoning: reasoning,
        major_reviews: majorReviews
      });
    }
    
    // Create default improvement recommendations if monitoring keyword exists
    if (monitoring_keyword) {
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
    if (isSelectLocationPage && rankingAnalysis.length > 20) {
      console.log('🔍 Gemini - Limiting ranking analysis to 20 results for Select Location page');
      rankingAnalysis = rankingAnalysis.slice(0, 20);
    } else if (!isSelectLocationPage && rankingAnalysis.length > 10) {
      console.log('🔍 Gemini - Limiting ranking analysis to 10 results for Results page');
      rankingAnalysis = rankingAnalysis.slice(0, 10);
    }

    console.log('🔍 Gemini - Final ranking analysis count:', rankingAnalysis.length);
    console.log('🔍 Gemini - Final ranking analysis ranks:', rankingAnalysis.map(item => item.rank));

    const payload: GeminiResultsResponse = { 
      text,
      rankingAnalysis,
      keywordPosition: keywordPosition > 0 ? keywordPosition : undefined,
      monitoringKeyword: monitoring_keyword,
      improvementRecommendations: improvementRecommendations.length > 0 ? improvementRecommendations : undefined
    };
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};


