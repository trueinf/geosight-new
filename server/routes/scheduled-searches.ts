import { Request, Response } from "express";
import supabase from "../db";

export async function handleCreateScheduledSearch(req: Request, res: Response) {
  try {
    const { keywords } = req.body;

    if (!keywords || typeof keywords !== 'string') {
      return res.status(400).json({ error: "keywords is required and must be a string" });
    }

    const keywordList = keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);
    
    if (keywordList.length === 0 || keywordList.length > 25) {
      return res.status(400).json({ error: "Must provide 1-25 keywords/phrases" });
    }

    const { data, error } = await supabase
      .from('scheduled_searches')
      .insert({
        keywords,
        keywords_list: keywordList.join(','),
        is_active: true
      })
      .select('id')
      .single();

    if (error) {
      console.error("Supabase error creating scheduled search:", error);
      return res.status(500).json({ error: "Failed to create scheduled search", details: error.message });
    }

    res.json({ success: true, id: data.id });
  } catch (error) {
    console.error("Error creating scheduled search:", error);
    res.status(500).json({ error: "Failed to create scheduled search" });
  }
}

export async function handleGetScheduledSearches(req: Request, res: Response) {
  try {
    const { data: searches, error } = await supabase
      .from('scheduled_searches')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Supabase error getting scheduled searches:", error);
      return res.status(500).json({ error: "Failed to get scheduled searches", details: error.message });
    }

    res.json({ searches: searches || [] });
  } catch (error) {
    console.error("Error getting scheduled searches:", error);
    res.status(500).json({ error: "Failed to get scheduled searches" });
  }
}

export async function handleDeleteScheduledSearch(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('scheduled_searches')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error("Supabase error deleting scheduled search:", error);
      return res.status(500).json({ error: "Failed to delete scheduled search", details: error.message });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting scheduled search:", error);
    res.status(500).json({ error: "Failed to delete scheduled search" });
  }
}
