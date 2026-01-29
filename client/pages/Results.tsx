import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ResultsHeader from "@/components/results/ResultsHeader";
import KeywordTabs from "@/components/results/KeywordTabs";
import VisibilityCharts from "@/components/results/VisibilityCharts";
import ProviderTabs from "@/components/results/ProviderTabs";
import ResultsList from "@/components/results/ResultsList";
import FullPageSpinner from "@/components/FullPageSpinner";
import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchAllProviderItems, type ProviderKey, type ParsedResultItem, type ImprovementRecommendation } from "@/lib/api";
import { resultsCache } from "@/lib/cache";

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const [providerItems, setProviderItems] = useState<Partial<Record<ProviderKey, ParsedResultItem[]>>>({});
  const [improvementRecommendations, setImprovementRecommendations] = useState<Record<ProviderKey, ImprovementRecommendation[] | undefined>>({ claude: undefined, openai: undefined, perplexity: undefined, gemini: undefined });
  const [keywordPositions, setKeywordPositions] = useState<Record<ProviderKey, number | undefined>>({ claude: undefined, openai: undefined, perplexity: undefined, gemini: undefined });
  const [loading, setLoading] = useState<boolean>(true);
  
  // Debug loading state changes
  useEffect(() => {
    console.log('🔍 Loading state changed to:', loading);
  }, [loading]);
  const [error, setError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState<boolean>(false);
  const [isAnalysisCompleted, setIsAnalysisCompleted] = useState<boolean>(false);
  const hasFetched = useRef<string | null>(null);
  const isFetching = useRef<boolean>(false);

  // Check if we have required parameters - support both old (q/target) and new (keywords) format
  const params = new URLSearchParams(location.search);
  const urlKeywords = params.get("keywords");
  const oldQuery = params.get("q");
  const oldTarget = params.get("target");
  
  // Convert old format to new format if needed
  const [keywords, setKeywords] = useState<string | null>(() => {
    if (urlKeywords) return urlKeywords;
    if (oldQuery) {
      const keywordList = [oldQuery];
      if (oldTarget) keywordList.push(oldTarget);
      return keywordList.join(',');
    }
    return null;
  });
  
  // Update keywords when URL changes
  useEffect(() => {
    if (urlKeywords) {
      setKeywords(urlKeywords);
    } else if (oldQuery) {
      const keywordList = [oldQuery];
      if (oldTarget) keywordList.push(oldTarget);
      const newKeywords = keywordList.join(',');
      setKeywords(newKeywords);
      const newParams = new URLSearchParams();
      newParams.set('keywords', newKeywords);
      if (params.get('provider')) {
        newParams.set('provider', params.get('provider')!);
      }
      window.history.replaceState({}, '', `/results?${newParams.toString()}`);
    }
  }, [urlKeywords, oldQuery, oldTarget, params]);
  
  const keywordList = keywords ? keywords.split(',').map(k => k.trim()).filter(k => k.length > 0) : [];
  const hasRequiredParams = keywordList.length > 0;
  
  // Get selected keyword from URL or default to first
  const selectedKeywordParam = params.get('selectedKeyword');
  const selectedKeyword = selectedKeywordParam || keywordList[0] || '';

  // Handle cache checking for when no parameters provided
  useEffect(() => {
    if (!hasRequiredParams) {
      // Look for the most recent cached result
      let mostRecentCache: { key: string; data: any } | null = null;
      let mostRecentTime = 0;
      
      for (const [key, cache] of resultsCache.entries()) {
        if (cache.timestamp > mostRecentTime) {
          mostRecentTime = cache.timestamp;
          mostRecentCache = { key, data: cache };
        }
      }
      
      // If we have recent cached data (within 5 minutes), show it
      if (mostRecentCache && (Date.now() - mostRecentTime) < 5 * 60 * 1000) {
        console.log('✅ Using most recent cached data without parameters:', mostRecentCache.key);
        
        // Update URL with the cached query parameters
        const cachedData = mostRecentCache.data;
        const newParams = new URLSearchParams();
        if (cachedData.keywords) {
          newParams.set('keywords', cachedData.keywords);
        } else if (cachedData.query) {
          newParams.set('keywords', cachedData.query);
        }
        newParams.set('provider', 'claude');
        
        // Replace current URL without triggering navigation
        window.history.replaceState({}, '', `/results?${newParams.toString()}`);
        
        // Set the cached data
        setProviderItems(cachedData.data.providerItems || cachedData.data);
        setImprovementRecommendations(cachedData.data.improvementRecommendations || { claude: undefined, openai: undefined, perplexity: undefined, gemini: undefined });
        setKeywordPositions(cachedData.data.keywordPositions || { claude: undefined, openai: undefined, perplexity: undefined, gemini: undefined });
        setLoading(false);
        setError(null);
        setShowDemo(false);
      } else {
        // No valid cache, show demo state
        setShowDemo(true);
        setLoading(false);
      }
    } else {
      setShowDemo(false);
    }
  }, [hasRequiredParams]);

  // Single fetch for all providers; pass down as props
  useEffect(() => {
    console.log('🔍 Results useEffect - State check:', { 
      hasRequiredParams, 
      keywords, 
      keywordList, 
      selectedKeyword,
      loading, 
      showDemo,
      error 
    });
    
    if (!hasRequiredParams) {
      console.log('🔍 No required params, setting loading to false');
      setLoading(false);
      setShowDemo(true);
      return;
    }
    
    // Create cache key that includes both all keywords AND the selected keyword
    const trimmedKeywords = keywordList.map(k => k.trim()).filter(k => k.length > 0);
    const displayKeyword = selectedKeyword || trimmedKeywords[0] || '';
    const currentKey = `${keywords || ''}|${displayKeyword}`;
    const hasTimestamp = params.get('ts');
    console.log('🔍 Results useEffect triggered:', { currentKey, selectedKeyword, displayKeyword, hasFetched: hasFetched.current, hasTimestamp, hasRequiredParams, keywordList });
    
    // Reset fetch state if selected keyword changed
    if (hasFetched.current && !hasFetched.current.includes(`|${displayKeyword}`)) {
      console.log('🔄 Selected keyword changed, resetting fetch state');
      hasFetched.current = null;
      isFetching.current = false;
    }
    
    // Check cache first - but skip cache if timestamp parameter is present (re-analyze)
    const cachedResult = resultsCache.get(currentKey);
    const cacheAge = cachedResult ? Date.now() - cachedResult.timestamp : Infinity;
    const cacheValid = cacheAge < 5 * 60 * 1000;
    
    if (cachedResult && cacheValid && !hasTimestamp) {
      console.log('✅ Using cached data for:', currentKey);
      setProviderItems(cachedResult.data);
      setImprovementRecommendations(cachedResult.improvementRecommendations || { claude: undefined, openai: undefined, perplexity: undefined, gemini: undefined });
      setKeywordPositions(cachedResult.keywordPositions || { claude: undefined, openai: undefined, perplexity: undefined, gemini: undefined });
      setLoading(false);
      setError(null);
      hasFetched.current = currentKey;
      return;
    }
    
    if (hasFetched.current === currentKey && !cachedResult && !hasTimestamp) {
      console.log('✅ Skipping fetch - already fetched for this key');
      return;
    }
    
    if (isFetching.current && hasFetched.current === currentKey) {
      console.log('✅ Skipping fetch - already fetching for this key');
      return;
    }
    
    if (hasTimestamp) {
      console.log('🔄 Re-analyzing with timestamp:', hasTimestamp);
    } else {
      console.log('🚀 Making API calls for:', currentKey, 'displayKeyword:', displayKeyword);
    }
    console.log('🔍 Parameters:', { keywords, keywordList, selectedKeyword, displayKeyword });
    setLoading(true);
    setError(null);
    hasFetched.current = currentKey;
    isFetching.current = true;
    
    (async () => {
      try {
        if (keywordList.length === 0) {
          throw new Error('No keywords provided');
        }
        
        // Use selected keyword for UI display
        
        // Always try to load from database first (no explicit backend calls when switching)
        let result: any = null;
        let loadedFromDatabase = false;
        
        try {
          const dbResponse = await fetch(`/api/get-results?keyword=${encodeURIComponent(displayKeyword)}`);
          if (dbResponse.ok) {
            const dbData = await dbResponse.json();
            if (dbData.providerResults) {
              // Convert database results to expected format
              const providerItems: Record<ProviderKey, ParsedResultItem[]> = {
                claude: dbData.providerResults.claude?.results || [],
                openai: dbData.providerResults.openai?.results || [],
                gemini: dbData.providerResults.gemini?.results || [],
                perplexity: dbData.providerResults.perplexity?.results || []
              };
              const improvementRecommendations: Record<ProviderKey, ImprovementRecommendation[] | undefined> = {
                claude: dbData.providerResults.claude?.improvementRecommendations,
                openai: dbData.providerResults.openai?.improvementRecommendations,
                gemini: dbData.providerResults.gemini?.improvementRecommendations,
                perplexity: dbData.providerResults.perplexity?.improvementRecommendations
              };
              const keywordPositions: Record<ProviderKey, number | undefined> = {
                claude: dbData.providerResults.claude?.keywordPosition,
                openai: dbData.providerResults.openai?.keywordPosition,
                gemini: dbData.providerResults.gemini?.keywordPosition,
                perplexity: dbData.providerResults.perplexity?.keywordPosition
              };
              
              if (Object.values(providerItems).some(items => items && items.length > 0)) {
                result = { providerItems, improvementRecommendations, keywordPositions };
                loadedFromDatabase = true;
                console.log('✅ Loaded results from database for:', displayKeyword);
              }
            }
          }
        } catch (dbError) {
          console.log('Database fetch error:', dbError);
        }
        
        // Only make backend API calls if no database results found (first time search)
        if (!loadedFromDatabase) {
          console.log('🔍 No database results found, making API calls for:', displayKeyword);
          result = await fetchAllProviderItems(displayKeyword, '', 'results');
        } else {
          console.log('✅ Using database results, skipping API calls for:', displayKeyword);
        }
        console.log('🔍 All provider results:', result);
        setProviderItems(result.providerItems);
        setImprovementRecommendations(result.improvementRecommendations);
        setKeywordPositions(result.keywordPositions);
        
        // Cache with the key that includes selected keyword
        resultsCache.set(currentKey, {
          data: result.providerItems,
          improvementRecommendations: result.improvementRecommendations,
          keywordPositions: result.keywordPositions,
          timestamp: Date.now(),
          keywords: keywords || '',
          selectedKeyword: displayKeyword
        });

        // Store results in database only if we made API calls (first time search)
        if (!loadedFromDatabase && result) {
          try {
            // Store results for the keyword we just searched
            for (const provider of ['claude', 'openai', 'gemini', 'perplexity'] as const) {
              const items = result.providerItems[provider] || [];
              if (items.length > 0) {
                await fetch('/api/store-results', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    keyword: displayKeyword,
                    provider,
                    queryText: displayKeyword,
                    results: items,
                    rankingAnalysis: undefined,
                    improvementRecommendations: result.improvementRecommendations[provider],
                    keywordPosition: result.keywordPositions[provider]
                  })
                });
              }
            }

            // Create scheduled search if it doesn't exist (for scheduler to process all keywords)
            await fetch('/api/scheduled-searches', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ keywords: keywords })
            });
          } catch (error) {
            console.error('Error storing results:', error);
          }
        } else {
          console.log('✅ Results loaded from database, skipping storage');
        }
      } catch (e) {
        setError((e as Error).message || "Failed to fetch results");
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    })();
  }, [keywords, selectedKeyword, location.search]); // Depend on keywords, selected keyword, and URL params

  // Handle timestamp changes for re-analysis
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hasTimestamp = params.get('ts');
    const currentKey = keywords || '';
    
    if (hasTimestamp && hasFetched.current === currentKey) {
      console.log('🔄 Timestamp change detected, triggering re-analysis');
      hasFetched.current = null;
      isFetching.current = false;
    }
  }, [location.search, keywords]);

  // Monitor when analysis is completed (when we have at least one provider with data)
  useEffect(() => {
    const hasAnyData = Object.values(providerItems).some(items => items && items.length > 0);
    setIsAnalysisCompleted(hasAnyData);
  }, [providerItems]);


  // Show demo state when no cached data is available
  if (showDemo) {
    return (
      <div className="min-h-screen gradient-bg">
        <Header />
        <main className="pt-[77px] pb-16">
          <div className="max-w-[1280px] mx-auto px-6">
            {/* Demo state intentionally left minimal */}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen gradient-bg">
        <Header />
        <main className="pt-[77px] pb-16">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
                <p className="text-gray-600 mb-4">{error}</p>
                <button 
                  onClick={() => navigate("/")}
                  className="px-4 py-2 bg-geo-blue-500 text-white rounded-lg hover:bg-geo-blue-600 transition-colors"
                >
                  Back to Analysis
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show loading state if we have params but are still loading
  if (loading && hasRequiredParams && !error && !isAnalysisCompleted) {
    return (
      <div className="min-h-screen gradient-bg">
        <Header />
        <main className="pt-[77px] pb-16">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="text-geo-slate-600 text-lg mb-2">Loading analysis...</div>
                <div className="text-geo-slate-400 text-sm">Fetching results from AI providers</div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
        <FullPageSpinner isVisible={true} />
      </div>
    );
  }

  // Always render - ensure we never return null/undefined
  console.log('🔍 Results render - Current state:', { 
    keywords, 
    hasRequiredParams, 
    loading, 
    error, 
    showDemo,
    isAnalysisCompleted,
    providerItemsCount: Object.keys(providerItems).length
  });

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      
      {/* Main Content */}
      <main className="pt-[77px] pb-16">
        <div className="max-w-[1280px] mx-auto px-6">
          {keywords ? (
            <>
              <ResultsHeader providerItems={providerItems as Record<ProviderKey, ParsedResultItem[]>} />
              
              {/* Keyword Tabs - show when multiple keywords */}
              {keywordList.length > 1 && (
                <KeywordTabs keywords={keywordList} selectedKeyword={selectedKeyword} />
              )}
              
              {/* Provider Tabs */}
              <div className="mt-6">
                <ProviderTabs 
                  providerItems={providerItems as Record<ProviderKey, ParsedResultItem[]>} 
                  target="" 
                />
              </div>
              
              {/* Results List */}
              <div className="mt-6">
                <ResultsList 
                  providerItems={providerItems as Record<ProviderKey, ParsedResultItem[]>} 
                  improvementRecommendations={improvementRecommendations}
                  keywordPositions={keywordPositions}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="text-geo-slate-600 mb-4">No keywords provided</div>
                <button 
                  onClick={() => navigate("/")}
                  className="px-4 py-2 bg-geo-blue-500 text-white rounded-lg hover:bg-geo-blue-600 transition-colors"
                >
                  Go to Home
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      
      {/* Full Page Spinner - Show when analysis is in progress */}
      <FullPageSpinner 
        isVisible={
          hasRequiredParams && 
          !isAnalysisCompleted && 
          !showDemo && 
          !error &&
          loading
        } 
      />
    </div>
  );
}
