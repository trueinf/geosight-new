import { Request, Response } from "express";
import supabase from "../db";
import type { ProviderKey } from "@shared/api";

export async function handleStoreResults(req: Request, res: Response) {
  try {
    const { keyword, provider, queryText, results, rankingAnalysis, improvementRecommendations, keywordPosition } = req.body;

    if (!keyword || !provider || !queryText || !results) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data, error } = await supabase
      .from('search_results')
      .insert({
        keyword,
        provider,
        query_text: queryText,
        results_json: results,
        ranking_analysis_json: rankingAnalysis || null,
        improvement_recommendations_json: improvementRecommendations || null,
        keyword_position: keywordPosition || null,
        search_timestamp: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error("Supabase error storing results:", error);
      return res.status(500).json({ error: "Failed to store results", details: error.message });
    }

    res.json({ success: true, id: data.id });
  } catch (error) {
    console.error("Error storing results:", error);
    res.status(500).json({ error: "Failed to store results" });
  }
}

export async function handleGetBrandRankings(req: Request, res: Response) {
  try {
    const { brandName, keyword, startDate, endDate } = req.query;

    if (!brandName) {
      return res.status(400).json({ error: "brandName is required" });
    }

    let query = supabase
      .from('brand_rankings')
      .select('keyword, provider, rank, search_timestamp, created_at')
      .eq('brand_name', brandName as string);

    if (keyword) {
      query = query.eq('keyword', keyword as string);
    }

    if (startDate) {
      query = query.gte('search_timestamp', startDate as string);
    }

    if (endDate) {
      query = query.lte('search_timestamp', endDate as string);
    }

    query = query.order('search_timestamp', { ascending: false });

    const { data: rankings, error } = await query;

    if (error) {
      console.error("Supabase error getting brand rankings:", error);
      return res.status(500).json({ error: "Failed to get brand rankings", details: error.message });
    }

    res.json({ rankings: rankings || [] });
  } catch (error) {
    console.error("Error getting brand rankings:", error);
    res.status(500).json({ error: "Failed to get brand rankings" });
  }
}

export async function handleStoreBrandRanking(req: Request, res: Response) {
  try {
    const { keyword, brandName, provider, rank, resultId, searchTimestamp } = req.body;

    if (!keyword || !brandName || !provider) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data, error } = await supabase
      .from('brand_rankings')
      .insert({
        keyword,
        brand_name: brandName,
        provider,
        rank: rank || null,
        result_id: resultId || null,
        search_timestamp: searchTimestamp || new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error("Supabase error storing brand ranking:", error);
      return res.status(500).json({ error: "Failed to store brand ranking", details: error.message });
    }

    res.json({ success: true, id: data.id });
  } catch (error) {
    console.error("Error storing brand ranking:", error);
    res.status(500).json({ error: "Failed to store brand ranking" });
  }
}
