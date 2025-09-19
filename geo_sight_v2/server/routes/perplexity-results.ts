import type { RequestHandler } from "express";
import type { PerplexityResultsRequest, PerplexityResultsResponse } from "@shared/api";

const PPLX_URL = "https://api.perplexity.ai/chat/completions";

export const handlePerplexityResults: RequestHandler = async (req, res) => {
  try {
    const { user_query, monitoring_keyword }: PerplexityResultsRequest = req.body ?? {};

    if (!process.env.PERPLEXITY_API_KEY) {
      res.status(500).json({ error: "Missing PERPLEXITY_API_KEY" });
      return;
    }

    if (!user_query || typeof user_query !== "string") {
      res.status(400).json({ error: "user_query is required" });
      return;
    }

    const prompt = `You are a strict formatter. Follow the output spec exactly.

CONTEXT
- Platform: Perplexity
- user_query: "${user_query}"
- monitoring_keyword: "${monitoring_keyword || "the query topic"}"
- target_item: "${monitoring_keyword || "the query topic"}"

TASK
1) Based on the query, return the 5 most relevant results. Favor items that match the target_item (case-insensitive).  
   - Output strictly as a numbered list from 1 to 5.  
   - Each item must be a COMPLETE result in the following exact 5-line format:
     Title: <brand/model/main item>
     Description: <up to 100 words>
     Rating: <X/5>
     Price: <$X or $A - $B>
     Website: <domain or URL, if known>
   - Include a Reasons Panel after the 5 items containing ALL signals for each item:
        - Product Mentions: Present/Absent + frequency
        - Sentiment: Positive, Neutral, or Negative
        - Supporting Context: (reviews, reputation, trust indicators)
        - Competitor Mentions: Reason why ranked here vs. others
   - DO NOT separate metrics into individual ranked items

2) After the list, check if the keyword appears in the top 5.  
   - If yes → "Keyword found at position X"  
   - If no → "Keyword not in top 5"

RULES
- No preface, no explanations, no extra lines.  
- Keep descriptions short and factual.  
- Follow format strictly.`;

    const response = await fetch(PPLX_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({ error: errText });
      return;
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json?.choices?.[0]?.message?.content ?? "";
    const payload: PerplexityResultsResponse = { text };
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};


