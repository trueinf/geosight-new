import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ResultsHeader from "@/components/results/ResultsHeader";
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

  // Check if we have required parameters
  const params = new URLSearchParams(location.search);
  const q = params.get("q");
  const target = params.get("target");
  const hasRequiredParams = q && target;

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
        newParams.set('q', cachedData.query);
        newParams.set('target', cachedData.target);
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
    if (!hasRequiredParams) {
      setLoading(false);
      return;
    }
    
    const currentKey = `${q}-${target}`;
    const hasTimestamp = params.get('ts'); // Check if this is a re-analyze request
    console.log('🔍 Results useEffect triggered:', { currentKey, hasFetched: hasFetched.current, hasTimestamp });
    
    // Check cache first - but skip cache if timestamp parameter is present (re-analyze)
    const cachedResult = resultsCache.get(currentKey);
    const cacheAge = cachedResult ? Date.now() - cachedResult.timestamp : Infinity;
    const cacheValid = cacheAge < 5 * 60 * 1000; // 5 minutes cache validity
    
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
    
    // Only fetch if we haven't fetched yet or if query/target changed or if re-analyzing
    if (hasFetched.current === currentKey && !cachedResult && !hasTimestamp) {
      console.log('✅ Skipping fetch - already fetched for this key');
      return;
    }
    
    // Prevent duplicate concurrent fetches
    if (isFetching.current) {
      console.log('✅ Skipping fetch - already fetching');
      return;
    }
    
    if (hasTimestamp) {
      console.log('🔄 Re-analyzing with timestamp:', hasTimestamp);
    } else {
      console.log('🚀 Making API calls for:', currentKey);
    }
    console.log('🔍 Parameters:', { q, target, hasQ: !!q, hasTarget: !!target });
    setLoading(true);
    setError(null);
    hasFetched.current = currentKey;
    isFetching.current = true;
    
    (async () => {
      try {
        // Ensure we have valid parameters
        if (!q || !target) {
          throw new Error(`Missing required parameters: q=${q}, target=${target}`);
        }
        const result = await fetchAllProviderItems(q, target, 'results');
        console.log('🔍 All provider results:', result);
        setProviderItems(result.providerItems);
        setImprovementRecommendations(result.improvementRecommendations);
        setKeywordPositions(result.keywordPositions);
        
        // Cache the results
        resultsCache.set(currentKey, {
          data: result.providerItems,
          improvementRecommendations: result.improvementRecommendations,
          keywordPositions: result.keywordPositions,
          timestamp: Date.now(),
          query: q!,
          target: target!
        });
      } catch (e) {
        setError((e as Error).message || "Failed to fetch results");
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    })();
  }, [q, target]); // Only depend on q and target, handle timestamp changes via ref

  // Handle timestamp changes for re-analysis
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hasTimestamp = params.get('ts');
    const currentKey = `${q}-${target}`;
    
    if (hasTimestamp && hasFetched.current === currentKey) {
      console.log('🔄 Timestamp change detected, triggering re-analysis');
      // Reset the fetch state to allow re-analysis
      hasFetched.current = null;
      isFetching.current = false;
    }
  }, [location.search, q, target]);

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

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      
      {/* Main Content */}
      <main className="pt-[77px] pb-16">
        <div className="max-w-[1280px] mx-auto px-6">
          <ResultsHeader providerItems={providerItems as Record<ProviderKey, ParsedResultItem[]>} />
          
          
          {/* Current Trends & Insights removed as requested */}
          
          
          {/* Provider Tabs */}
          <div className="mt-6">
            <ProviderTabs 
              providerItems={providerItems as Record<ProviderKey, ParsedResultItem[]>} 
              target={new URLSearchParams(location.search).get('target') || ''} 
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
          
          
        </div>
      </main>

      <Footer />
      
      {/* Full Page Spinner - Show when analysis is in progress */}
      <FullPageSpinner 
        isVisible={
          hasRequiredParams && 
          !isAnalysisCompleted && 
          !showDemo && 
          !error
        } 
      />
    </div>
  );
}
