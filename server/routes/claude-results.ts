import type { RequestHandler } from "express";
import type { ClaudeResultsRequest, ClaudeResultsResponse } from "@shared/api";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

export const handleClaudeResults: RequestHandler = async (req, res) => {
  try {
    const { user_query, monitoring_keyword }: ClaudeResultsRequest = req.body ?? {};

    if (!process.env.ANTHROPIC_API_KEY) {
      res.status(500).json({ error: "Missing ANTHROPIC_API_KEY" });
      return;
    }

    if (!user_query || typeof user_query !== "string") {
      res.status(400).json({ error: "user_query is required" });
      return;
    }

    const prompt = `You are a strict formatter. Follow the output spec exactly.

CONTEXT
- Platform: Claude
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

2) After the list, check if the keyword appears in the top 5 titles.  
   - If yes → "Keyword found at position X"  
   - If no → "Keyword not in top 5"

RULES
- No preface, no explanations, no extra lines.  
- Keep descriptions short and factual.  
- Follow format strictly.`;

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({ error: errText });
      return;
    }

    const data = (await response.json()) as { content?: Array<{ text?: string }> };
    const text = data?.content?.[0]?.text ?? "";

    const payload: ClaudeResultsResponse = { text };
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};


