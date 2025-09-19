import type { RequestHandler } from "express";
import type { GeminiResultsRequest, GeminiResultsResponse } from "@shared/api";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export const handleGeminiResults: RequestHandler = async (req, res) => {
  try {
    const { user_query, monitoring_keyword }: GeminiResultsRequest = req.body ?? {};

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: "Missing GEMINI_API_KEY" });
      return;
    }

    if (!user_query || typeof user_query !== "string") {
      res.status(400).json({ error: "user_query is required" });
      return;
    }

    const prompt = `You are a strict formatter. Follow the output spec exactly.

CONTEXT
- Platform: Gemini
- user_query: "${user_query}"
- monitoring_keyword: "${monitoring_keyword ?? "the query topic"}"
 - target_item: "${monitoring_keyword ?? "the query topic"}"

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

    async function callGemini(url: string) {
      return fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048,
          },
        }),
      });
    }

    // Retry with exponential backoff on 429/5xx
    const modelUrls = [
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
    ];

    let resp = await callGemini(modelUrls[0]);

    if (!resp.ok) {
      const firstError = { status: resp.status, body: await resp.text() };
      
      // Special handling for 429 (rate limit) errors
      if (resp.status === 429) {
        console.log('⚠️ Rate limit hit, waiting before retry...');
        // Wait longer for rate limit errors
        await new Promise((r) => setTimeout(r, 1000)); // Reduced to 1 second initial delay
      }
      
      // Try fallback model with retries
      let attempt = 0;
      const maxAttempts = 3;
      while (attempt < maxAttempts) {
        const delayMs = resp.status === 429 ? 1000 * Math.pow(2, attempt) : 300 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delayMs));
        resp = await callGemini(modelUrls[Math.min(1, attempt)]);
        if (resp.ok) break;
        attempt++;
      }
      if (!resp.ok) {
        const text = await resp.text();
        console.error('❌ Gemini request failed after retries:', { status: resp.status, text });
        res.status(resp.status).json({ 
          error: "Gemini request failed", 
          details: resp.status === 429 ? "Rate limit exceeded. Please try again in a few minutes." : "API request failed",
          firstError, 
          finalError: text 
        });
        return;
      }
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

    const payload: GeminiResultsResponse = { text };
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};


