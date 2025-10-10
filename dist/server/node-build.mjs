import path from "path";
import "dotenv/config";
import * as express from "express";
import express__default from "express";
import cors from "cors";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const handleClaudeResults = async (req, res) => {
  try {
    console.log("🔍 Claude handler - req.body:", req.body);
    console.log("🔍 Claude handler - req.method:", req.method);
    console.log("🔍 Claude handler - req.url:", req.url);
    console.log("🔍 Claude handler - req.headers:", req.headers);
    const { user_query, monitoring_keyword } = req.body ?? {};
    if (!process.env.ANTHROPIC_API_KEY) {
      res.status(500).json({ error: "Missing ANTHROPIC_API_KEY" });
      return;
    }
    if (!user_query || typeof user_query !== "string") {
      console.log("🔍 Claude handler - user_query validation failed:", { user_query, type: typeof user_query });
      res.status(400).json({ error: "user_query is required" });
      return;
    }
    const prompt = `You are a strict formatter. Follow the output spec exactly.

CONTEXT
- Platform: Claude
- user_query: "${user_query}"

TASK
1) Based on the query, return the 5 most relevant results.  
   - Output strictly as a numbered list from 1 to 5.  
   - Each item must be a COMPLETE result in the following exact 5-line format:
     Title: <brand/model/main item>
     Description: <up to 100 words>
     Rating: <X/5>
     Price: <$X or $A - $B>
     Website: <domain or URL, if known>

2) After the list, provide a simple summary of the results.

3) After the summary, provide a ranking analysis for each item in this exact JSON format:
{
  "ranking_analysis": [
    {
      "provider": "claude",
      "target": "<item title>",
      "rank": <position number>,
      "matched_keywords": ["<keywords from query that matched>"],
      "contextual_signals": ["<contextual mentions like comparisons, expert mentions>"],
      "competitor_presence": ["<competitors and their ranks>"],
      "sentiment": "<positive|neutral|negative>",
      "citation_domains": ["<domains mentioned>"],
      "llm_reasoning": "<brief explanation of why ranked this position>"
    }
  ]
}

4) MANDATORY: If "${monitoring_keyword || "the query topic"}" appears anywhere in the results (position 2-5), you MUST provide improvement recommendations in this exact JSON format:
{
  "improvement_recommendations": [
    {
      "category": "SEO & Content Strategy",
      "title": "Optimize ${monitoring_keyword || "the target"} content strategy",
      "description": "Create targeted content highlighting ${monitoring_keyword || "the target"}'s unique features and benefits",
      "timeframe": "immediate",
      "expectedImpact": "Could improve ranking by 1-2 positions"
    },
    {
      "category": "Brand Strategy", 
      "title": "Enhance ${monitoring_keyword || "the target"} brand visibility",
      "description": "Increase ${monitoring_keyword || "the target"} mentions and reviews across key platforms",
      "timeframe": "mid-term",
      "expectedImpact": "Better brand recognition and higher rankings"
    }
  ]
}

CRITICAL: Always include improvement recommendations if ${monitoring_keyword || "the target"} is found at positions 2-5.

RULES
- No preface, no explanations, no extra lines.  
- Keep descriptions short and factual.  
- Follow format strictly.
- Include ranking analysis for ALL 5 items.`;
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({ error: errText });
      return;
    }
    const data = await response.json();
    const text = data?.content?.[0]?.text ?? "";
    console.log("🔍 Claude full response text:", text);
    console.log("🔍 Claude response contains improvement_recommendations:", text.includes("improvement_recommendations"));
    let keywordPosition = -1;
    if (monitoring_keyword) {
      const lines = text.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes("Title:") && line.toLowerCase().includes(monitoring_keyword.toLowerCase())) {
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
    let rankingAnalysis = [];
    let improvementRecommendations = [];
    try {
      const jsonStart = text.indexOf('{\n  "ranking_analysis":');
      if (jsonStart !== -1) {
        const jsonText = text.substring(jsonStart);
        let braceCount = 0;
        let jsonEnd = -1;
        for (let i = 0; i < jsonText.length; i++) {
          if (jsonText[i] === "{") braceCount++;
          if (jsonText[i] === "}") braceCount--;
          if (braceCount === 0) {
            jsonEnd = i + 1;
            break;
          }
        }
        if (jsonEnd !== -1) {
          const jsonString = jsonText.substring(0, jsonEnd);
          console.log("🔍 Claude extracted JSON string:", jsonString);
          const analysisData = JSON.parse(jsonString);
          rankingAnalysis = analysisData.ranking_analysis || [];
          console.log("🔍 Claude parsed ranking analysis:", rankingAnalysis);
          const improvementStart = text.indexOf('{\n  "improvement_recommendations":');
          if (improvementStart !== -1) {
            const improvementText = text.substring(improvementStart);
            let improvementBraceCount = 0;
            let improvementEnd = -1;
            for (let i = 0; i < improvementText.length; i++) {
              if (improvementText[i] === "{") improvementBraceCount++;
              if (improvementText[i] === "}") improvementBraceCount--;
              if (improvementBraceCount === 0) {
                improvementEnd = i + 1;
                break;
              }
            }
            if (improvementEnd !== -1) {
              try {
                const improvementJsonString = improvementText.substring(0, improvementEnd);
                console.log("🔍 Claude extracted improvement JSON:", improvementJsonString);
                const improvementData = JSON.parse(improvementJsonString);
                improvementRecommendations = improvementData.improvement_recommendations || [];
                console.log("🔍 Claude parsed improvement recommendations:", improvementRecommendations);
              } catch (e) {
                console.log("🔍 Claude failed to parse improvement recommendations:", e);
              }
            }
          }
        } else {
          console.log("🔍 Claude JSON appears truncated, trying to extract partial data");
          try {
            const analysisMatches = jsonText.matchAll(/\{\s*"provider"[^}]*"llm_reasoning"[^}]*\}/g);
            for (const match of analysisMatches) {
              try {
                const partialAnalysis = JSON.parse(match[0]);
                if (partialAnalysis.provider && partialAnalysis.llm_reasoning) {
                  rankingAnalysis.push(partialAnalysis);
                }
              } catch (e) {
                console.log("🔍 Claude failed to parse partial analysis:", match[0]);
              }
            }
            console.log("🔍 Claude extracted partial ranking analysis:", rankingAnalysis);
          } catch (error) {
            console.log("🔍 Claude failed to extract partial JSON:", error);
          }
        }
      } else {
        console.log("🔍 Claude: No ranking_analysis JSON found in response");
        console.log("🔍 Claude response text preview:", text.substring(0, 500));
      }
    } catch (error) {
      console.error("Claude failed to parse ranking analysis:", error);
      console.error("Claude error details:", error);
    }
    const payload = {
      text,
      rankingAnalysis,
      keywordPosition: keywordPosition > 0 ? keywordPosition : void 0,
      monitoringKeyword: monitoring_keyword,
      improvementRecommendations: improvementRecommendations.length > 0 ? improvementRecommendations : void 0
    };
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const handleGeminiResults = async (req, res) => {
  try {
    const { user_query, monitoring_keyword } = req.body ?? {};
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

TASK
1) Based on the query, return the 5 most relevant results.  
   - Output strictly as a numbered list from 1 to 5.  
   - Each item must be a COMPLETE result in the following exact 5-line format:
     Title: <brand/model/main item>
     Description: <up to 100 words>
     Rating: <X/5>
     Price: <$X or $A - $B>
     Website: <domain or URL, if known>

2) After the list, provide a simple summary of the results.

3) After the summary, provide a ranking analysis for each item in this exact JSON format:
{
  "ranking_analysis": [
    {
      "provider": "gemini",
      "target": "<item title>",
      "rank": <position number>,
      "matched_keywords": ["<keywords from query that matched>"],
      "contextual_signals": ["<contextual mentions like comparisons, expert mentions>"],
      "competitor_presence": ["<competitors and their ranks>"],
      "sentiment": "<positive|neutral|negative>",
      "citation_domains": ["<domains mentioned>"],
      "llm_reasoning": "<brief explanation of why ranked this position>"
    }
  ]
}

4) MANDATORY: If "${monitoring_keyword || "the query topic"}" appears anywhere in the results (position 2-5), you MUST provide improvement recommendations in this exact JSON format:
{
  "improvement_recommendations": [
    {
      "category": "SEO & Content Strategy",
      "title": "Optimize ${monitoring_keyword || "the target"} content strategy",
      "description": "Create targeted content highlighting ${monitoring_keyword || "the target"}'s unique features and benefits",
      "timeframe": "immediate",
      "expectedImpact": "Could improve ranking by 1-2 positions"
    },
    {
      "category": "Brand Strategy", 
      "title": "Enhance ${monitoring_keyword || "the target"} brand visibility",
      "description": "Increase ${monitoring_keyword || "the target"} mentions and reviews across key platforms",
      "timeframe": "mid-term",
      "expectedImpact": "Better brand recognition and higher rankings"
    }
  ]
}

CRITICAL: Always include improvement recommendations if ${monitoring_keyword || "the target"} is found at positions 2-5.

RULES
- No preface, no explanations, no extra lines.  
- Keep descriptions short and factual.  
- Follow format strictly.
- Include ranking analysis for ALL 5 items.`;
    async function callGemini(url) {
      console.log("🔍 Gemini calling URL (UPDATED CODE):", url);
      return fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 3072
          }
        })
      });
    }
    const modelUrls = [
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent",
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent"
    ];
    let resp = await callGemini(modelUrls[0]);
    if (!resp.ok) {
      const firstError = { status: resp.status, body: await resp.text() };
      console.log("🔍 Gemini first request failed:", firstError);
      if (resp.status === 429) {
        console.log("⚠️ Rate limit hit, waiting before retry...");
        await new Promise((r) => setTimeout(r, 1e3));
      }
      let attempt = 0;
      const maxAttempts = 3;
      while (attempt < maxAttempts) {
        const delayMs = resp.status === 429 ? 1e3 * Math.pow(2, attempt) : 300 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delayMs));
        resp = await callGemini(modelUrls[Math.min(1, attempt)]);
        if (resp.ok) break;
        attempt++;
      }
      if (!resp.ok) {
        const text2 = await resp.text();
        console.error("❌ Gemini request failed after retries:", { status: resp.status, text: text2 });
        res.status(resp.status).json({
          error: "Gemini request failed",
          details: resp.status === 429 ? "Rate limit exceeded. Please try again in a few minutes." : "API request failed",
          firstError,
          finalError: text2
        });
        return;
      }
    }
    const json = await resp.json();
    let text = "";
    const cand0 = json?.candidates?.[0];
    if (cand0?.content?.parts?.[0]?.text) text = cand0.content.parts[0].text;
    else if (Array.isArray(cand0?.content) && cand0.content[0]?.parts?.[0]?.text) text = cand0.content[0].parts[0].text;
    else if (cand0?.content?.parts && typeof cand0.content.parts === "string") text = cand0.content.parts;
    if (!text || typeof text !== "string") {
      res.status(502).json({ error: "Gemini returned no text", details: { finishReason: cand0?.finishReason, safetyRatings: cand0?.safetyRatings } });
      return;
    }
    let keywordPosition = -1;
    if (monitoring_keyword) {
      const lines = text.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes("Title:") && line.toLowerCase().includes(monitoring_keyword.toLowerCase())) {
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
    let rankingAnalysis = [];
    let improvementRecommendations = [];
    try {
      const jsonPattern = /\{\s*"ranking_analysis"\s*:/;
      const jsonMatch = text.match(jsonPattern);
      if (jsonMatch) {
        const jsonStart = jsonMatch.index;
        const jsonText = text.substring(jsonStart);
        let braceCount = 0;
        let jsonEnd = -1;
        for (let i = 0; i < jsonText.length; i++) {
          if (jsonText[i] === "{") braceCount++;
          if (jsonText[i] === "}") braceCount--;
          if (braceCount === 0) {
            jsonEnd = i + 1;
            break;
          }
        }
        if (jsonEnd !== -1) {
          const jsonString = jsonText.substring(0, jsonEnd);
          console.log("🔍 Gemini extracted JSON string:", jsonString);
          const analysisData = JSON.parse(jsonString);
          rankingAnalysis = analysisData.ranking_analysis || [];
          console.log("🔍 Gemini parsed ranking analysis:", rankingAnalysis);
          const improvementStart = text.indexOf('{\n  "improvement_recommendations":');
          if (improvementStart !== -1) {
            const improvementText = text.substring(improvementStart);
            let improvementBraceCount = 0;
            let improvementEnd = -1;
            for (let i = 0; i < improvementText.length; i++) {
              if (improvementText[i] === "{") improvementBraceCount++;
              if (improvementText[i] === "}") improvementBraceCount--;
              if (improvementBraceCount === 0) {
                improvementEnd = i + 1;
                break;
              }
            }
            if (improvementEnd !== -1) {
              try {
                const improvementJsonString = improvementText.substring(0, improvementEnd);
                console.log("🔍 Gemini extracted improvement JSON:", improvementJsonString);
                const improvementData = JSON.parse(improvementJsonString);
                improvementRecommendations = improvementData.improvement_recommendations || [];
                console.log("🔍 Gemini parsed improvement recommendations:", improvementRecommendations);
              } catch (e) {
                console.log("🔍 Gemini failed to parse improvement recommendations:", e);
              }
            }
          }
        } else {
          console.log("🔍 Gemini JSON appears truncated, trying to extract partial data");
          try {
            const analysisMatches = jsonText.matchAll(/\{\s*"provider"[^}]*"llm_reasoning"[^}]*\}/g);
            for (const match of analysisMatches) {
              try {
                const partialAnalysis = JSON.parse(match[0]);
                if (partialAnalysis.provider && partialAnalysis.llm_reasoning) {
                  rankingAnalysis.push(partialAnalysis);
                }
              } catch (e) {
                console.log("🔍 Gemini failed to parse partial analysis:", match[0]);
              }
            }
            console.log("🔍 Gemini extracted partial ranking analysis:", rankingAnalysis);
          } catch (error) {
            console.log("🔍 Gemini failed to extract partial JSON:", error);
          }
        }
      } else {
        console.log("🔍 Gemini: No ranking_analysis JSON found in response");
        console.log("🔍 Gemini response text preview:", text.substring(0, 500));
      }
    } catch (error) {
      console.error("Gemini failed to parse ranking analysis:", error);
      console.error("Gemini error details:", error);
    }
    const payload = {
      text,
      rankingAnalysis,
      keywordPosition: keywordPosition > 0 ? keywordPosition : void 0,
      monitoringKeyword: monitoring_keyword,
      improvementRecommendations: improvementRecommendations.length > 0 ? improvementRecommendations : void 0
    };
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const handleOpenAIResults = async (req, res) => {
  try {
    const { user_query, monitoring_keyword } = req.body ?? {};
    if (!process.env.OPENAI_API_KEY) {
      res.status(500).json({ error: "Missing OPENAI_API_KEY" });
      return;
    }
    if (!user_query || typeof user_query !== "string") {
      res.status(400).json({ error: "user_query is required" });
      return;
    }
    const prompt = `You are a strict formatter. Follow the output spec exactly.

CONTEXT
- Platform: OpenAI
- user_query: "${user_query}"

TASK
1) Based on the query, return the 5 most relevant results.  
   - Output strictly as a numbered list from 1 to 5.  
   - Each item must be a COMPLETE result in the following exact 5-line format:
     Title: <brand/model/main item>
     Description: <up to 100 words>
     Rating: <X/5>
     Price: <$X or $A - $B>
     Website: <domain or URL, if known>

2) After the list, provide a simple summary of the results.

3) After the summary, provide a ranking analysis for each item in this exact JSON format:
{
  "ranking_analysis": [
    {
      "provider": "openai",
      "target": "<item title>",
      "rank": <position number>,
      "matched_keywords": ["<keywords from query that matched>"],
      "contextual_signals": ["<contextual mentions like comparisons, expert mentions>"],
      "competitor_presence": ["<competitors and their ranks>"],
      "sentiment": "<positive|neutral|negative>",
      "citation_domains": ["<domains mentioned>"],
      "llm_reasoning": "<brief explanation of why ranked this position>"
    }
  ]
}

4) MANDATORY: If "${monitoring_keyword || "the query topic"}" appears anywhere in the results (position 2-5), you MUST provide improvement recommendations in this exact JSON format:
{
  "improvement_recommendations": [
    {
      "category": "SEO & Content Strategy",
      "title": "Optimize ${monitoring_keyword || "the target"} content strategy",
      "description": "Create targeted content highlighting ${monitoring_keyword || "the target"}'s unique features and benefits",
      "timeframe": "immediate",
      "expectedImpact": "Could improve ranking by 1-2 positions"
    },
    {
      "category": "Brand Strategy", 
      "title": "Enhance ${monitoring_keyword || "the target"} brand visibility",
      "description": "Increase ${monitoring_keyword || "the target"} mentions and reviews across key platforms",
      "timeframe": "mid-term",
      "expectedImpact": "Better brand recognition and higher rankings"
    }
  ]
}

CRITICAL: Always include improvement recommendations if ${monitoring_keyword || "the target"} is found at positions 2-5.

RULES
- No preface, no explanations, no extra lines.  
- Keep descriptions short and factual.  
- Follow format strictly.
- Include ranking analysis for ALL 5 items.`;
    async function callOpenAI() {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2e4);
      try {
        const response = await fetch(OPENAI_URL, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1500,
            temperature: 0.1
          })
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
          throw new Error("OpenAI request timed out after 30 seconds");
        }
        throw error;
      }
    }
    const resp = await callOpenAI();
    if (!resp.ok) {
      const text2 = await resp.text();
      res.status(resp.status).json({ error: "OpenAI request failed", details: text2 });
      return;
    }
    const json = await resp.json();
    const text = json?.choices?.[0]?.message?.content ?? "";
    console.log("🔍 OpenAI full response text:", text);
    console.log("🔍 OpenAI response contains improvement_recommendations:", text.includes("improvement_recommendations"));
    let keywordPosition = -1;
    if (monitoring_keyword) {
      const lines = text.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes("Title:") && line.toLowerCase().includes(monitoring_keyword.toLowerCase())) {
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
    let rankingAnalysis = [];
    let improvementRecommendations = [];
    try {
      const jsonPattern = /\{\s*"ranking_analysis"\s*:/;
      const jsonMatch = text.match(jsonPattern);
      if (jsonMatch) {
        const jsonStart = jsonMatch.index;
        const jsonText = text.substring(jsonStart);
        let braceCount = 0;
        let jsonEnd = -1;
        for (let i = 0; i < jsonText.length; i++) {
          if (jsonText[i] === "{") braceCount++;
          if (jsonText[i] === "}") braceCount--;
          if (braceCount === 0) {
            jsonEnd = i + 1;
            break;
          }
        }
        if (jsonEnd !== -1) {
          const jsonString = jsonText.substring(0, jsonEnd);
          console.log("🔍 Extracted JSON string:", jsonString);
          const analysisData = JSON.parse(jsonString);
          rankingAnalysis = analysisData.ranking_analysis || [];
          console.log("🔍 Parsed ranking analysis:", rankingAnalysis);
          let improvementStart = text.indexOf('{\n  "improvement_recommendations":');
          if (improvementStart === -1) {
            improvementStart = text.indexOf('{ "improvement_recommendations":');
          }
          if (improvementStart === -1) {
            improvementStart = text.indexOf('"improvement_recommendations":');
          }
          if (improvementStart !== -1) {
            const improvementText = text.substring(improvementStart);
            let improvementBraceCount = 0;
            let improvementEnd = -1;
            for (let i = 0; i < improvementText.length; i++) {
              if (improvementText[i] === "{") improvementBraceCount++;
              if (improvementText[i] === "}") improvementBraceCount--;
              if (improvementBraceCount === 0) {
                improvementEnd = i + 1;
                break;
              }
            }
            if (improvementEnd !== -1) {
              try {
                const improvementJsonString = improvementText.substring(0, improvementEnd);
                console.log("🔍 OpenAI extracted improvement JSON:", improvementJsonString);
                const improvementData = JSON.parse(improvementJsonString);
                improvementRecommendations = improvementData.improvement_recommendations || [];
                console.log("🔍 OpenAI parsed improvement recommendations:", improvementRecommendations);
              } catch (e) {
                console.log("🔍 OpenAI failed to parse improvement recommendations:", e);
              }
            }
          }
        } else {
          console.log("🔍 JSON appears truncated, trying to extract partial data");
          try {
            const analysisMatches = jsonText.matchAll(/\{\s*"provider"[^}]*"llm_reasoning"[^}]*\}/g);
            for (const match of analysisMatches) {
              try {
                const partialAnalysis = JSON.parse(match[0]);
                if (partialAnalysis.provider && partialAnalysis.llm_reasoning) {
                  rankingAnalysis.push(partialAnalysis);
                }
              } catch (e) {
                console.log("🔍 Failed to parse partial analysis:", match[0]);
              }
            }
            console.log("🔍 Extracted partial ranking analysis:", rankingAnalysis);
          } catch (error) {
            console.log("🔍 Failed to extract partial JSON:", error);
          }
        }
      } else {
        console.log("🔍 No ranking_analysis JSON found in response");
        console.log("🔍 Response text preview:", text.substring(0, 500));
      }
    } catch (error) {
      console.error("Failed to parse ranking analysis:", error);
      console.error("Error details:", error);
    }
    const payload = {
      text,
      rankingAnalysis,
      keywordPosition: keywordPosition > 0 ? keywordPosition : void 0,
      monitoringKeyword: monitoring_keyword,
      improvementRecommendations: improvementRecommendations.length > 0 ? improvementRecommendations : void 0
    };
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const handlePerplexityResults = async (req, res) => {
  try {
    const { user_query, monitoring_keyword } = req.body ?? {};
    console.log("🔍 Perplexity request (UPDATED CODE):", { user_query, monitoring_keyword });
    if (!process.env.OPENROUTER_API_KEY) {
      res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });
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

TASK
1) Based on the query, return the 5 most relevant results.  
   - Output strictly as a numbered list from 1 to 5.  
   - Each item must be a COMPLETE result in the following exact 5-line format:
     Title: <brand/model/main item>
     Description: <up to 100 words>
     Rating: <X/5>
     Price: <$X or $A - $B>
     Website: <domain or URL, if known>

2) After the list, provide a simple summary of the results.

3) After the summary, provide a ranking analysis for each item in this exact JSON format:
{
  "ranking_analysis": [
    {
      "provider": "perplexity",
      "target": "<item title>",
      "rank": <position number>,
      "matched_keywords": ["<keywords from query that matched>"],
      "contextual_signals": ["<contextual mentions like comparisons, expert mentions>"],
      "competitor_presence": ["<competitors and their ranks>"],
      "sentiment": "<positive|neutral|negative>",
      "citation_domains": ["<domains mentioned>"],
      "llm_reasoning": "<brief explanation of why ranked this position>"
    }
  ]
}

4) MANDATORY: If "${monitoring_keyword || "the query topic"}" appears anywhere in the results (position 2-5), you MUST provide improvement recommendations in this exact JSON format:
{
  "improvement_recommendations": [
    {
      "category": "SEO & Content Strategy",
      "title": "Optimize ${monitoring_keyword || "the target"} content strategy",
      "description": "Create targeted content highlighting ${monitoring_keyword || "the target"}'s unique features and benefits",
      "timeframe": "immediate",
      "expectedImpact": "Could improve ranking by 1-2 positions"
    },
    {
      "category": "Brand Strategy", 
      "title": "Enhance ${monitoring_keyword || "the target"} brand visibility",
      "description": "Increase ${monitoring_keyword || "the target"} mentions and reviews across key platforms",
      "timeframe": "mid-term",
      "expectedImpact": "Better brand recognition and higher rankings"
    }
  ]
}

CRITICAL: Always include improvement recommendations if ${monitoring_keyword || "the target"} is found at positions 2-5.

RULES
- No preface, no explanations, no extra lines.  
- Keep descriptions short and factual.  
- Follow format strictly.
- Include ranking analysis for ALL 5 items.`;
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.SITE_URL || "https://geosight.app",
        "X-Title": process.env.SITE_NAME || "GeoSight",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2048
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({ error: errText });
      return;
    }
    const json = await response.json();
    const text = json?.choices?.[0]?.message?.content ?? "";
    let keywordPosition = -1;
    if (monitoring_keyword) {
      const lines = text.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes("Title:") && line.toLowerCase().includes(monitoring_keyword.toLowerCase())) {
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
    let rankingAnalysis = [];
    let improvementRecommendations = [];
    try {
      const jsonPattern = /\{\s*"ranking_analysis"\s*:/;
      const jsonMatch = text.match(jsonPattern);
      if (jsonMatch) {
        const jsonStart = jsonMatch.index;
        const jsonText = text.substring(jsonStart);
        let braceCount = 0;
        let jsonEnd = -1;
        for (let i = 0; i < jsonText.length; i++) {
          if (jsonText[i] === "{") braceCount++;
          if (jsonText[i] === "}") braceCount--;
          if (braceCount === 0) {
            jsonEnd = i + 1;
            break;
          }
        }
        if (jsonEnd !== -1) {
          const jsonString = jsonText.substring(0, jsonEnd);
          const analysisData = JSON.parse(jsonString);
          rankingAnalysis = analysisData.ranking_analysis || [];
          let improvementStart = text.indexOf('{\n  "improvement_recommendations":');
          if (improvementStart === -1) {
            improvementStart = text.indexOf('{ "improvement_recommendations":');
          }
          if (improvementStart === -1) {
            improvementStart = text.indexOf('"improvement_recommendations":');
          }
          console.log("🔍 Perplexity improvement recommendations search:", {
            improvementStart,
            textContainsImprovement: text.includes("improvement_recommendations"),
            textPreview: text.substring(0, 1e3)
          });
          if (improvementStart !== -1) {
            const improvementText = text.substring(improvementStart);
            let improvementBraceCount = 0;
            let improvementEnd = -1;
            for (let i = 0; i < improvementText.length; i++) {
              if (improvementText[i] === "{") improvementBraceCount++;
              if (improvementText[i] === "}") improvementBraceCount--;
              if (improvementBraceCount === 0) {
                improvementEnd = i + 1;
                break;
              }
            }
            if (improvementEnd !== -1) {
              try {
                const improvementJsonString = improvementText.substring(0, improvementEnd);
                console.log("🔍 Perplexity extracted improvement JSON:", improvementJsonString);
                const improvementData = JSON.parse(improvementJsonString);
                improvementRecommendations = improvementData.improvement_recommendations || [];
                console.log("🔍 Perplexity parsed improvement recommendations:", improvementRecommendations);
              } catch (e) {
                console.log("🔍 Perplexity failed to parse improvement recommendations:", e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to parse ranking analysis:", error);
    }
    const payload = {
      text,
      rankingAnalysis,
      keywordPosition: keywordPosition > 0 ? keywordPosition : void 0,
      monitoringKeyword: monitoring_keyword,
      improvementRecommendations: improvementRecommendations.length > 0 ? improvementRecommendations : void 0
    };
    console.log("🔍 Perplexity final payload:", {
      hasText: !!text,
      rankingAnalysisCount: rankingAnalysis.length,
      keywordPosition,
      monitoringKeyword,
      improvementRecommendationsCount: improvementRecommendations.length,
      improvementRecommendations
    });
    res.json(payload);
  } catch (error) {
    console.error("OpenRouter API error:", error);
    res.status(500).json({ error: error.message });
  }
};
function createServer() {
  const app2 = express__default();
  app2.use(cors());
  app2.use(express__default.json({ limit: "10mb" }));
  app2.use(express__default.urlencoded({ extended: true, limit: "10mb" }));
  app2.use((req, res, next) => {
    console.log("🔍 Request:", { method: req.method, url: req.url, body: req.body });
    next();
  });
  app2.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });
  app2.post("/api/test", (req, res) => {
    console.log("🔍 Test endpoint hit:", { body: req.body, headers: req.headers });
    res.json({
      message: "Test endpoint working",
      body: req.body,
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : []
    });
  });
  app2.post("/api/claude/results", handleClaudeResults);
  app2.post("/api/gemini/results", handleGeminiResults);
  app2.post("/api/openai/results", handleOpenAIResults);
  app2.post("/api/perplexity/results", handlePerplexityResults);
  return app2;
}
const app = createServer();
const port = process.env.PORT || 3e3;
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");
app.use(express.static(distPath));
app.get("/*", (req, res) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(distPath, "index.html"));
});
app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
//# sourceMappingURL=node-build.mjs.map
