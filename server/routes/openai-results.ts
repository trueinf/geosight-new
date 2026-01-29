import type { RequestHandler } from "express";
import type { OpenAIResultsRequest, OpenAIResultsResponse, RankingAnalysisResponse } from "@shared/api";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// Helper function to extract domain from URL
function extractDomainFromUrl(url: string): string {
  try {
    // Remove protocol and www
    let domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
    // Remove path and query parameters
    domain = domain.split('/')[0].split('?')[0].split('#')[0];
    // Remove trailing punctuation
    domain = domain.replace(/[.,;!?]+$/, '');
    return domain;
  } catch (error) {
    return url;
  }
}

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
      // Simple prompt for 10 results
      prompt = `List 10 items for: ${user_query}

1. Title: [Item Name]
Description: [Detailed description mentioning competitors if relevant]
Rating: [X.X/5]
Price: $[price]
Website: [actual website URL like royalcaribbean.com or carnival.com]
Major Reviews: [Up to 10 major review sites/platforms, comma-separated. Examples: "Yelp, TripAdvisor, Google Reviews, Booking.com, Expedia"]

2-10. [Same format]

Use real names and actual website URLs. Include competitor mentions in descriptions when relevant.`;
      maxTokens = 1400; // Increased for 10 items with richer data
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
    
    // Quick fallback promise
    // const fallbackPromise = new Promise<Response>((resolve) => {
    //   setTimeout(() => {
    //     console.log('🔍 OpenAI API taking too long, using fallback response');
    //     const fallbackData = {
    //       choices: [{
    //         message: {
    //           content: `I apologize, but I'm currently experiencing high demand and cannot provide a complete response for your query: "${user_query}". Please try again in a few moments, or consider using one of the other AI providers available.`
    //         }
    //       }]
    //     };
    //     resolve(new Response(JSON.stringify(fallbackData), {
    //       status: 200,
    //       headers: { 'Content-Type': 'application/json' }
    //     }));
    //   }, 7000); // 7 second fallback
    // });
    
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
      //const response = await Promise.race([apiPromise, fallbackPromise]);
      const response = await Promise.race([apiPromise]);
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
      console.log('🔍 OpenAI API Full Response:', JSON.stringify(data, null, 2));

      // Enhanced parsing for results
      const rankingAnalysis: RankingAnalysisResponse[] = [];
      
      console.log('🔍 Full ChatGPT response text:', text);
      
      // Helper: sanitize title (strip markdown and leading label)
      const sanitizeTitle = (raw: string | undefined): string | undefined => {
        if (!raw) return raw;
        let t = raw;
        t = t.replace(/^\*\*Title:\s*/i, '');
        t = t.replace(/^Title:\s*/i, '');
        t = t.replace(/^\d+\.[\s]*/i, '');
        t = t.replace(/^\*\*|\*\*$/g, '');
        t = t.replace(/\*([^*]+)\*/g, '$1');
        t = t.trim();
        return t;
      };
      
      // Extract structured data from the response
      const lines = text.split('\n').filter(line => line.trim());
      let currentItem: any = {};
      let rank = 1;
      
      console.log('🔍 Parsing lines:', lines.length);
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        console.log('🔍 Processing line:', trimmedLine);
        
        // Extract title/name - more flexible matching
        if (trimmedLine.match(/^\d+\.\s*Title:\s*(.+)/i) || 
            trimmedLine.match(/^Title:\s*(.+)/i) ||
            trimmedLine.match(/^\d+\.\s*(.+)/i)) {
          if (currentItem.title) {
            // Save previous item
            rankingAnalysis.push({
              provider: "openai",
              target: sanitizeTitle(currentItem.title) || currentItem.title,
              rank: rank,
              matched_keywords: [user_query],
              contextual_signals: ["search relevance"],
              competitor_presence: currentItem.competitors || [],
              sentiment: "positive",
              citation_domains: currentItem.websites || [],
              llm_reasoning: `Ranked #${rank} in search results for "${user_query}"`,
              major_reviews: currentItem.major_reviews
            });
            rank++;
          }
          // Start new item
          const titleMatch = trimmedLine.match(/^\d+\.\s*Title:\s*(.+)/i) || 
                           trimmedLine.match(/^Title:\s*(.+)/i) ||
                           trimmedLine.match(/^\d+\.\s*(.+)/i);
          currentItem = { title: sanitizeTitle(titleMatch?.[1]) };
          console.log('🔍 Found title:', currentItem.title);
        }
        // Extract website - more flexible matching
        else if (trimmedLine.match(/^Website:\s*(.+)/i) || 
                 trimmedLine.match(/Website:\s*(.+)/i)) {
          const websiteMatch = trimmedLine.match(/^Website:\s*(.+)/i) || 
                              trimmedLine.match(/Website:\s*(.+)/i);
          if (websiteMatch?.[1] && 
              websiteMatch[1].trim() !== '[website.com]' && 
              websiteMatch[1].trim() !== 'website.com' &&
              websiteMatch[1].trim().length > 0) {
            const websiteText = websiteMatch[1].trim();
            // Handle markdown links: [domain](url) -> extract domain
            const markdownMatch = websiteText.match(/\[([^\]]+)\]\([^)]+\)/);
            if (markdownMatch) {
              currentItem.websites = [markdownMatch[1]];
            } else {
              // Extract domain from regular URL
              currentItem.websites = [extractDomainFromUrl(websiteText)];
            }
            console.log('🔍 Found website:', currentItem.websites);
          }
        }
        // Extract description for competitor analysis
        else if (trimmedLine.match(/^Description:\s*(.+)/i) || 
                 trimmedLine.match(/Description:\s*(.+)/i)) {
          const descMatch = trimmedLine.match(/^Description:\s*(.+)/i) || 
                           trimmedLine.match(/Description:\s*(.+)/i);
          if (descMatch?.[1]) {
            currentItem.description = descMatch[1].trim();
            console.log('🔍 Found description:', currentItem.description);
            // Extract potential competitors from description
            const competitors = [];
            const desc = descMatch[1].toLowerCase();
            if (desc.includes('royal caribbean')) competitors.push('Royal Caribbean');
            if (desc.includes('carnival')) competitors.push('Carnival');
            if (desc.includes('norwegian')) competitors.push('Norwegian');
            if (desc.includes('disney')) competitors.push('Disney');
            if (desc.includes('princess')) competitors.push('Princess');
            if (desc.includes('celebrity')) competitors.push('Celebrity');
            if (desc.includes('holland america')) competitors.push('Holland America');
            if (desc.includes('msc')) competitors.push('MSC');
            if (desc.includes('virgin')) competitors.push('Virgin Voyages');
            if (competitors.length > 0) {
              currentItem.competitors = competitors;
              console.log('🔍 Found competitors:', currentItem.competitors);
            }
          }
        }
        // Extract Major Reviews (comma-separated) - tolerate bullets, bold, dashes/colons, and label variants
        else {
          const majorReviewsRegexes = [
            /^(?:[-*]\s*)?(?:\*\*)?\s*(Major\s+Reviews?|Review\s+Sites?|Reviews)\s*(?:\*\*)?\s*[:\-]\s*(.+)$/i,
            // Fallback simple pattern without punctuation after label
            /^(?:[-*]\s*)?(?:\*\*)?\s*(Major\s+Reviews?|Review\s+Sites?|Reviews)\s*(?:\*\*)?\s+(.*)$/i
          ];
          let mrMatch: RegExpMatchArray | null = null;
          for (const rx of majorReviewsRegexes) {
            const m = trimmedLine.match(rx);
            if (m && m[2]) { mrMatch = m; break; }
          }
          if (mrMatch && mrMatch[2]) {
            const value = mrMatch[2];
            currentItem.major_reviews = value
              .split(',')
              .map((r: string) => r.replace(/^[\"'\s]+|[\"'\s]+$/g, ''))
              .filter((r: string) => r)
              .slice(0, 10);
            console.log('🔍 Found major reviews:', currentItem.major_reviews);
          }
        }
      }
      
      // Add the last item
      if (currentItem.title) {
        rankingAnalysis.push({
          provider: "openai",
          target: sanitizeTitle(currentItem.title) || currentItem.title,
          rank: rank,
          matched_keywords: [user_query],
          contextual_signals: ["search relevance"],
          competitor_presence: currentItem.competitors || [],
          sentiment: "positive",
          citation_domains: currentItem.websites || [],
          llm_reasoning: `Ranked #${rank} in search results for "${user_query}"`,
          major_reviews: currentItem.major_reviews
        });
      }
      
      // If we still don't have websites, try to extract URLs from the entire text
      if (rankingAnalysis.length > 0 && rankingAnalysis.every(item => item.citation_domains.length === 0)) {
        console.log('🔍 No websites found, extracting URLs from text');
        
        // Extract markdown links first: [text](url)
        const markdownLinks = text.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
        const markdownDomains = markdownLinks.map(link => {
          const match = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (match) {
            const linkText = match[1];
            const linkUrl = match[2];
            // Use the link text if it looks like a domain, otherwise extract domain from URL
            if (linkText.includes('.') && !linkText.includes(' ')) {
              return linkText;
            } else {
              return extractDomainFromUrl(linkUrl);
            }
          }
          return null;
        }).filter(Boolean);
        
        // Extract regular URLs
        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/g;
        const urls = text.match(urlRegex) || [];
        const regularDomains = urls
          .map(url => extractDomainFromUrl(url))
          .filter(domain => domain && !domain.includes('[') && !domain.includes(']') && domain.length > 3);
        
        // Combine and deduplicate
        const allDomains = [...markdownDomains, ...regularDomains];
        const uniqueDomains = [...new Set(allDomains)].slice(0, rankingAnalysis.length);
        
        console.log('🔍 Extracted domains:', uniqueDomains);
        
        // Assign domains to results
        rankingAnalysis.forEach((item, index) => {
          if (uniqueDomains[index]) {
            item.citation_domains = [uniqueDomains[index]];
          }
        });
      }
      
      // If we still don't have competitors, try to extract from the entire text
      if (rankingAnalysis.length > 0 && rankingAnalysis.every(item => item.competitor_presence.length === 0)) {
        console.log('🔍 No competitors found, extracting from full text');
        const textLower = text.toLowerCase();
        const allCompetitors = [];
        
        if (textLower.includes('royal caribbean')) allCompetitors.push('Royal Caribbean');
        if (textLower.includes('carnival')) allCompetitors.push('Carnival');
        if (textLower.includes('norwegian')) allCompetitors.push('Norwegian');
        if (textLower.includes('disney')) allCompetitors.push('Disney');
        if (textLower.includes('princess')) allCompetitors.push('Princess');
        if (textLower.includes('celebrity')) allCompetitors.push('Celebrity');
        if (textLower.includes('holland america')) allCompetitors.push('Holland America');
        if (textLower.includes('msc')) allCompetitors.push('MSC');
        if (textLower.includes('virgin')) allCompetitors.push('Virgin Voyages');
        
        console.log('🔍 Found competitors in text:', allCompetitors);
        
        // Assign competitors to all results
        rankingAnalysis.forEach(item => {
          item.competitor_presence = [...allCompetitors];
        });
      }
      
      // Fallback: if no structured data found, try pattern matching
      if (rankingAnalysis.length === 0) {
        const hotelPatterns = [
          /Title:\s*([^\n]+)/gi,
          /(\d+\.\s*Title:\s*[^\n]+)/gi,
          /(\*\*[^*]+\*\*)/g,
          /([A-Z][a-z]+\s+(?:Hotel|Inn|Resort|Suites|Plaza|Tower|Palace|Manor|Lodge|House))/g,
          /([A-Z][a-z]+\s+(?:Cruise|Ship|Line|Vessel|Yacht))/g,
          /([A-Z][a-z]+\s+[A-Z][a-z]+)/g
        ];
        
        let foundMatches = false;
        
        for (const pattern of hotelPatterns) {
          const matches = text.match(pattern);
          if (matches && matches.length > 0) {
            console.log('🔍 Found matches with pattern:', pattern, matches.length);
            foundMatches = true;
            for (const match of matches.slice(0, 20)) {
              const hotelName = match.replace(/Title:\s*/i, '').replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim();
              if (hotelName && hotelName.length > 3 && !hotelName.includes('[') && !hotelName.includes(']')) {
                rankingAnalysis.push({
                  provider: "openai",
                  target: hotelName,
                  rank: rank,
                  matched_keywords: [user_query],
                  contextual_signals: ["search relevance"],
                  competitor_presence: [],
                  sentiment: "positive",
                  citation_domains: [],
                  llm_reasoning: `Ranked #${rank} in search results for "${user_query}"`
                });
                rank++;
              }
            }
            break;
          }
        }
      }
      
      // If no patterns matched, try to extract any capitalized words that might be names
      if (rankingAnalysis.length === 0 && text.length > 0) {
        console.log('🔍 No pattern matches found, trying fallback extraction');
        const words = text.split(/\s+/);
        const capitalizedWords = words.filter(word => 
          word.length > 3 && 
          /^[A-Z][a-z]+$/.test(word) && 
          !['Title', 'Description', 'Rating', 'Price', 'Website', 'IsHilton', 'Best', 'Hotels', 'Luxury', 'Business', 'Family'].includes(word)
        );
        
        for (let i = 0; i < Math.min(capitalizedWords.length, 20); i++) {
        rankingAnalysis.push({
          provider: "openai",
            target: capitalizedWords[i],
            rank: i + 1,
            matched_keywords: [user_query],
            contextual_signals: ["search relevance"],
          competitor_presence: [],
          sentiment: "positive",
            citation_domains: [],
            llm_reasoning: `Ranked #${i + 1} in search results for "${user_query}"`
          });
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
        res.status(408).json({ error: 'OpenAI request timed out after 25 seconds' });
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
