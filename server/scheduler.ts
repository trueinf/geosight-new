import supabase from "./db";
import { handleClaudeResults } from "./routes/claude-results";
import { handleOpenAIResults } from "./routes/openai-results";
import { handleGeminiResults } from "./routes/gemini-results";
import { handlePerplexityResults } from "./routes/perplexity-results";
import type { ProviderKey } from "@shared/api";
import type { Request, Response } from "express";

interface ScheduledSearch {
  id: number;
  keywords: string;
  keywords_list: string;
  is_active: boolean;
}

function getUSTimeZoneOffset(): number {
  const now = new Date();
  const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
  const usTime = new Date(utc.toLocaleString("en-US", { timeZone: "America/New_York" }));
  return (usTime.getTime() - utc.getTime()) / 60000;
}

function getNextScheduledTime(): Date {
  const now = new Date();
  const usOffset = getUSTimeZoneOffset();
  const usTime = new Date(now.getTime() + (usOffset * 60000));
  
  const hour = usTime.getHours();
  const nextHour = Math.ceil(hour / 2) * 2;
  
  const nextScheduled = new Date(usTime);
  nextScheduled.setHours(nextHour, 0, 0, 0);
  
  if (nextScheduled <= usTime) {
    nextScheduled.setHours(nextHour + 2, 0, 0, 0);
  }
  
  return new Date(nextScheduled.getTime() - (usOffset * 60000));
}

async function callProviderHandler(
  provider: ProviderKey,
  keyword: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = {
      body: {
        user_query: keyword,
        monitoring_keyword: keyword,
        page_type: 'results'
      }
    } as Request;

    let responseData: any = null;

    const res = {
      status: (code: number) => res,
      json: (data: any) => {
        responseData = data;
        resolve(data);
        return res;
      }
    } as unknown as Response;

    const handlers: Record<ProviderKey, (req: Request, res: Response) => Promise<void>> = {
      claude: handleClaudeResults,
      openai: handleOpenAIResults,
      gemini: handleGeminiResults,
      perplexity: handlePerplexityResults
    };

    handlers[provider](req, res).catch((err) => {
      console.error(`Error in ${provider} handler:`, err);
      reject(err);
    });
  });
}

async function runScheduledSearch(search: ScheduledSearch) {
  console.log(`🔄 Running scheduled search for keywords: ${search.keywords}`);
  
  const keywords = search.keywords_list.split(',').map(k => k.trim()).filter(k => k.length > 0);
  
  for (const keyword of keywords) {
    try {
      console.log(`🔍 Searching for keyword: ${keyword}`);
      
      const providers: ProviderKey[] = ["claude", "openai", "gemini", "perplexity"];
      
      for (const provider of providers) {
        try {
          const result = await callProviderHandler(provider, keyword);
          
          if (result && result.text) {
            const { error } = await supabase
              .from('search_results')
              .insert({
                keyword,
                provider,
                query_text: keyword,
                results_json: {
                  text: result.text,
                  items: [] // Will be parsed when retrieved
                },
                ranking_analysis_json: result.rankingAnalysis || null,
                improvement_recommendations_json: result.improvementRecommendations || null,
                keyword_position: result.keywordPosition || null,
                search_timestamp: new Date().toISOString()
              });

            if (error) {
              console.error(`❌ Error storing results for ${provider} - ${keyword}:`, error);
            } else {
              console.log(`✅ Stored results for ${provider} - ${keyword}`);
            }
          }
        } catch (error) {
          console.error(`❌ Error searching ${provider} for ${keyword}:`, error);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing keyword ${keyword}:`, error);
    }
  }
}

export function startScheduler() {
  console.log("🕐 Starting scheduled search system...");
  
  const runScheduledSearches = async () => {
    const { data: searches, error } = await supabase
      .from('scheduled_searches')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error("Error fetching scheduled searches:", error);
      return;
    }

    if (!searches || searches.length === 0) {
      console.log("ℹ️ No active scheduled searches found");
      return;
    }
    
    for (const search of searches as ScheduledSearch[]) {
      await runScheduledSearch(search);
    }
  };
  
  const scheduleNext = () => {
    const nextTime = getNextScheduledTime();
    const delay = nextTime.getTime() - Date.now();
    
    console.log(`⏰ Next scheduled search at: ${nextTime.toISOString()} (in ${Math.round(delay / 1000 / 60)} minutes)`);
    
    setTimeout(async () => {
      await runScheduledSearches();
      scheduleNext();
    }, delay);
  };
  
  scheduleNext();
  
  setInterval(async () => {
    const now = new Date();
    const usOffset = getUSTimeZoneOffset();
    const usTime = new Date(now.getTime() + (usOffset * 60000));
    const hour = usTime.getHours();
    
    if (hour % 2 === 0 && usTime.getMinutes() === 0) {
      await runScheduledSearches();
    }
  }, 60000);
}
