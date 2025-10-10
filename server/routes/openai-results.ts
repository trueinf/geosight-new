import type { RequestHandler } from "express";
import type { OpenAIResultsRequest, OpenAIResultsResponse, RankingAnalysisResponse } from "@shared/api";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export const handleOpenAIResults: RequestHandler = async (req, res) => {
  try {
    const { user_query, monitoring_keyword, page_type }: OpenAIResultsRequest = req.body ?? {};

    if (!process.env.OPENAI_API_KEY) {
      res.status(500).json({ error: "Missing OPENAI_API_KEY" });
      return;
    }

    if (!user_query || typeof user_query !== "string") {
      res.status(400).json({ error: "user_query is required" });
      return;
    }

    const isSelectLocationPage = page_type === 'select_location';
    
    let prompt: string;
    let maxTokens: number;
    
    if (isSelectLocationPage) {
      // Simple prompt for 20 results
      prompt = `List 20 hotels in ${user_query} in 4 categories (5 each).

**Best Hotels (5 results):**
1. Title: [Hotel Name]
Description: [Brief description]
Rating: [X.X/5]
Price: $[price]
Website: [website.com]
IsHilton: [Yes/No]

2-5. [Same format]

**Best Luxury Hotels (5 results):**
[Same format]

**Best Business Hotels (5 results):**
[Same format]

**Best Family Hotels (5 results):**
[Same format]

Use real hotel names.`;
      maxTokens = 1000; // Ultra low for speed
    } else {
      // Simple prompt for 5 results
      prompt = `List 5 items for: ${user_query}

1. Title: [Item Name]
Description: [Brief description]
Rating: [X.X/5]
Price: $[price]
Website: [website.com]

2-5. [Same format]

Use real names.`;
      maxTokens = 500; // Ultra low for speed
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    // Quick fallback promise
    const fallbackPromise = new Promise<Response>((resolve) => {
      setTimeout(() => {
        console.log('🔍 OpenAI API taking too long, using fallback response');
        const fallbackData = {
          choices: [{
            message: {
              content: `I apologize, but I'm currently experiencing high demand and cannot provide a complete response for your query: "${user_query}". Please try again in a few moments, or consider using one of the other AI providers available.`
            }
          }]
        };
        resolve(new Response(JSON.stringify(fallbackData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }, 7000); // 7 second fallback
    });
    
    try {
      console.log('🔍 OpenAI API Key length:', process.env.OPENAI_API_KEY?.length);
      console.log('🔍 OpenAI URL:', OPENAI_URL);
      console.log('🔍 OpenAI Model: gpt-4o-mini');
      console.log('🔍 OpenAI Max Tokens:', maxTokens);
      
      const apiPromise = fetch(OPENAI_URL, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
              content: "You are a helpful assistant that provides concise, accurate information."
              },
              {
                role: "user",
              content: prompt
            }
            ],
            max_tokens: maxTokens,
          temperature: 0.7,
          }),
        });

      console.log('🔍 Starting Promise.race between API and fallback...');
      const response = await Promise.race([apiPromise, fallbackPromise]);
      clearTimeout(timeoutId);
      console.log('🔍 Promise.race completed, response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        console.error('OpenAI API response headers:', response.headers);
        
        // Handle specific error cases
        if (response.status === 401) {
          res.status(401).json({ error: 'OpenAI API key is invalid or expired' });
          return;
        } else if (response.status === 429) {
          res.status(429).json({ error: 'OpenAI API rate limit exceeded' });
          return;
        } else if (response.status === 500) {
          res.status(500).json({ error: 'OpenAI API server error' });
          return;
        }
        
        res.status(response.status).json({ error: errorText });
      return;
    }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      
      console.log('🔍 OpenAI API Response Text:', text.substring(0, 500) + '...');
      console.log('🔍 OpenAI API Response Length:', text.length);

      // Enhanced parsing for results
      const rankingAnalysis: RankingAnalysisResponse[] = [];
      
      // Try to extract hotel names from the response using multiple patterns
      const hotelPatterns = [
        /Title:\s*([^\n]+)/gi,
        /(\d+\.\s*Title:\s*[^\n]+)/gi,
        /(\*\*[^*]+\*\*)/g,
        /([A-Z][a-z]+\s+(?:Hotel|Inn|Resort|Suites|Plaza|Tower|Palace|Manor|Lodge|House))/g
      ];
      
      let rank = 1;
      for (const pattern of hotelPatterns) {
        const matches = text.match(pattern);
        if (matches && matches.length > 0) {
          console.log('🔍 Found matches with pattern:', pattern, matches.length);
          for (const match of matches.slice(0, 20)) { // Limit to 20 results
            const hotelName = match.replace(/Title:\s*/i, '').replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim();
            if (hotelName && hotelName.length > 3) {
        rankingAnalysis.push({
          provider: "openai",
                target: hotelName,
          rank: rank,
                matched_keywords: [user_query],
                contextual_signals: ["search relevance"],
          competitor_presence: [],
          sentiment: "positive",
                citation_domains: [""],
                llm_reasoning: `Ranked #${rank} in search results for "${user_query}"`
              });
              rank++;
            }
          }
          break; // Use the first pattern that finds matches
        }
      }
      
      console.log('🔍 Parsed rankingAnalysis count:', rankingAnalysis.length);

      // Generate improvement recommendations based on the results
      const improvementRecommendations = rankingAnalysis.length > 0 ? [
        {
          title: "Enhance Online Presence",
          description: `Optimize website content with relevant keywords to improve visibility in search results and attract more online bookings for ${user_query}.`,
          category: "SEO & Content Strategy" as const,
          timeframe: "immediate" as const,
          expectedImpact: "Improved search engine ranking and increased website traffic."
        },
        {
          title: "Collaborate with Influential Reviewers",
          description: `Partner with popular industry influencers to showcase the unique offerings and experiences of ${user_query}, increasing brand visibility.`,
          category: "Authority & Citation Strategy" as const,
          timeframe: "mid-term" as const,
          expectedImpact: "Expanded reach and enhanced credibility among target audience."
        },
        {
          title: "Create Exclusive Brand Programs",
          description: `Develop tailored programs for customers, providing incentives for repeat engagement and fostering brand loyalty for ${user_query}.`,
          category: "Brand Strategy" as const,
          timeframe: "long-term" as const,
          expectedImpact: "Increased customer retention and positive brand association."
        },
        {
          title: "Implement Mobile-Friendly Website Design",
          description: `Optimize the website for mobile users to enhance user experience and accessibility, catering to the growing number of users accessing ${user_query} via mobile devices.`,
          category: "Technical Improvements" as const,
          timeframe: "immediate" as const,
          expectedImpact: "Higher conversion rates and improved customer satisfaction."
        }
      ] : undefined;

      const result: OpenAIResultsResponse = {
        text: text,
        rankingAnalysis: rankingAnalysis,
        improvementRecommendations: improvementRecommendations,
        keywordPosition: undefined,
        monitoringKeyword: monitoring_keyword
      };

      res.json(result);

    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        res.status(408).json({ error: 'OpenAI request timed out after 8 seconds' });
        return;
      }
      console.error('OpenAI fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch from OpenAI API' });
    }

  } catch (error) {
    console.error('OpenAI handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
