import type { RequestHandler } from "express";
import type { OpenAIResultsRequest, OpenAIResultsResponse } from "@shared/api";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export const handleOpenAIResults: RequestHandler = async (req, res) => {
  try {
    const { user_query, monitoring_keyword }: OpenAIResultsRequest = req.body ?? {};

    if (!process.env.OPENAI_API_KEY) {
      res.status(500).json({ error: "Missing OPENAI_API_KEY" });
      return;
    }

    if (!user_query || typeof user_query !== "string") {
      res.status(400).json({ error: "user_query is required" });
      return;
    }

    const prompt = `1. Based on the query: "${user_query}", list the top 5 most relevant results. Favor items that match the target "${monitoring_keyword ?? "the query topic"}" (case-insensitive).  
   - Return them strictly as a numbered list from 1 to 5.  
   - Keep results short (just the brand/model name or main item).  
2. After the list, check if the keyword "${monitoring_keyword ?? "the query topic"}" appears in the list.  
   - If yes, say: "Keyword found at position X".  
   - If no, say: "Keyword not in top 5".
3. Provide a brief summary explaining why these results are ranked in this order:
   - Include key factors like brand recognition, market position, or relevance
   - Keep it concise (1-2 sentences)
   - Focus on what makes each result relevant to the query

ADDITIONAL RULES (MANDATORY):
- For each item include:
  Title: <brand/model/main item>
  Description: <up to 100 words>
  Rating: <X/5>
  Price: <$X or $A - $B>
  Website: <domain or URL, if known>
If any field is unknown, reasonably estimate or write "N/A".`;

    // Retry wrapper for OpenAI similar to Gemini
    async function callOpenAI() {
      return fetch(OPENAI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1024,
        }),
      });
    }

    let resp = await callOpenAI();

    if (!resp.ok) {
      const firstError = { status: resp.status, body: await resp.text() };
      let attempt = 0;
      const maxAttempts = 2;
      while (attempt < maxAttempts) {
        const delayMs = 300 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delayMs));
        resp = await callOpenAI();
        if (resp.ok) break;
        attempt++;
      }
      if (!resp.ok) {
        const text = await resp.text();
        res.status(resp.status).json({ error: "OpenAI request failed", firstError, finalError: text });
        return;
      }
    }

    const json = (await resp.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json?.choices?.[0]?.message?.content ?? "";
    const payload: OpenAIResultsResponse = { text };
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};


