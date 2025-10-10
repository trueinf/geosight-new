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
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(OPENAI_URL, {
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

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        res.status(response.status).json({ error: errorText });
      return;
    }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";

      // Simple parsing for results
      const rankingAnalysis: RankingAnalysisResponse[] = [];
      const lines = text.split('\n');
      let currentRank = 0;
      let currentItem: any = {};

      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('Title:')) {
          if (currentItem.title) {
            rankingAnalysis.push({
              provider: "openai",
              target: currentItem.title,
              rank: currentRank,
              matched_keywords: [user_query],
              contextual_signals: ["search relevance"],
              competitor_presence: [],
              sentiment: "positive",
              citation_domains: [currentItem.website || ""],
              llm_reasoning: `Ranked #${currentRank} in search results for "${user_query}"`
            });
          }
          currentRank++;
          currentItem = {
            title: trimmedLine.replace('Title:', '').trim(),
            description: "",
            rating: "",
            price: "",
            website: "",
            isHilton: false
          };
        } else if (trimmedLine.startsWith('Description:')) {
          currentItem.description = trimmedLine.replace('Description:', '').trim();
        } else if (trimmedLine.startsWith('Rating:')) {
          currentItem.rating = trimmedLine.replace('Rating:', '').trim();
        } else if (trimmedLine.startsWith('Price:')) {
          currentItem.price = trimmedLine.replace('Price:', '').trim();
        } else if (trimmedLine.startsWith('Website:')) {
          currentItem.website = trimmedLine.replace('Website:', '').trim();
        } else if (trimmedLine.startsWith('IsHilton:')) {
          currentItem.isHilton = trimmedLine.replace('IsHilton:', '').trim().toLowerCase() === 'yes';
        }
      }

      // Add the last item
      if (currentItem.title) {
          rankingAnalysis.push({
            provider: "openai",
          target: currentItem.title,
          rank: currentRank,
          matched_keywords: [user_query],
          contextual_signals: ["search relevance"],
          competitor_presence: [],
          sentiment: "positive",
          citation_domains: [currentItem.website || ""],
          llm_reasoning: `Ranked #${currentRank} in search results for "${user_query}"`
        });
      }

      const result: OpenAIResultsResponse = {
        text: text,
        rankingAnalysis: rankingAnalysis,
        improvementRecommendations: undefined,
        keywordPosition: undefined,
        monitoringKeyword: monitoring_keyword
      };

      res.json(result);

    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        res.status(408).json({ error: 'OpenAI request timed out after 10 seconds' });
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
