import { Request, Response } from "express";
import supabase from "../db";
import type { ProviderKey } from "@shared/api";

export async function handleGetResults(req: Request, res: Response) {
  try {
    const { keyword } = req.query;

    if (!keyword || typeof keyword !== 'string') {
      return res.status(400).json({ error: "keyword is required" });
    }

    const { data: results, error } = await supabase
      .from('search_results')
      .select('*')
      .eq('keyword', keyword)
      .order('search_timestamp', { ascending: false })
      .limit(4);

    if (error) {
      console.error("Supabase error getting results:", error);
      return res.status(500).json({ error: "Failed to get results", details: error.message });
    }

    // Group by provider and get the most recent result for each
    const providerResults: Record<ProviderKey, any> = {
      claude: null,
      openai: null,
      gemini: null,
      perplexity: null
    };

    results?.forEach((result: any) => {
      const provider = result.provider as ProviderKey;
      if (!providerResults[provider]) {
        providerResults[provider] = {
          results: result.results_json,
          rankingAnalysis: result.ranking_analysis_json,
          improvementRecommendations: result.improvement_recommendations_json,
          keywordPosition: result.keyword_position
        };
      }
    });

    res.json({ providerResults });
  } catch (error) {
    console.error("Error getting results:", error);
    res.status(500).json({ error: "Failed to get results" });
  }
}
