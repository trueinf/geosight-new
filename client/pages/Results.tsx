import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ResultsHeader from "@/components/results/ResultsHeader";
import VisibilityCharts from "@/components/results/VisibilityCharts";
import CurrentTrends from "@/components/results/CurrentTrends";
import ImprovementRecommendations from "@/components/results/ImprovementRecommendations";
import ProviderTabs from "@/components/results/ProviderTabs";
import ResultsList from "@/components/results/ResultsList";
import AnalysisSummary from "@/components/results/AnalysisSummary";
import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchAllProviderItems, type ProviderKey, type ParsedResultItem } from "@/lib/api";

// Global cache to persist data across navigation
const resultsCache = new Map<string, {
  data: Record<ProviderKey, ParsedResultItem[]>;
  timestamp: number;
  query: string;
  target: string;
}>();

// Clear cache on page refresh (when performance navigation type is reload)
if (typeof window !== 'undefined' && window.performance) {
  const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navigation && navigation.type === 'reload') {
    resultsCache.clear();
    console.log('🔄 Cache cleared due to page refresh');
  }
}

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const [providerItems, setProviderItems] = useState<Partial<Record<ProviderKey, ParsedResultItem[]>>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState<boolean>(false);
  const hasFetched = useRef<string | null>(null);

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
        setProviderItems(cachedData.data);
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
    console.log('🔍 Results useEffect triggered:', { currentKey, hasFetched: hasFetched.current });
    
    // Check cache first
    const cachedResult = resultsCache.get(currentKey);
    const cacheAge = cachedResult ? Date.now() - cachedResult.timestamp : Infinity;
    const cacheValid = cacheAge < 5 * 60 * 1000; // 5 minutes cache validity
    
    if (cachedResult && cacheValid) {
      console.log('✅ Using cached data for:', currentKey);
      setProviderItems(cachedResult.data);
      setLoading(false);
      setError(null);
      hasFetched.current = currentKey;
      return;
    }
    
    // Only fetch if we haven't fetched yet or if query/target changed
    if (hasFetched.current === currentKey && !cachedResult) {
      console.log('✅ Skipping fetch - already fetched for this key');
      return;
    }
    
    console.log('🚀 Making API calls for:', currentKey);
    setLoading(true);
    setError(null);
    hasFetched.current = currentKey;
    
    (async () => {
      try {
        const all = await fetchAllProviderItems(q!, target!);
        console.log('🔍 All provider items:', all);
        setProviderItems(all);
        
        // Cache the results
        resultsCache.set(currentKey, {
          data: all,
          timestamp: Date.now(),
          query: q!,
          target: target!
        });
      } catch (e) {
        setError((e as Error).message || "Failed to fetch results");
      } finally {
        setLoading(false);
      }
    })();
  }, [location.search, hasRequiredParams, q, target]);


  // Show demo state when no cached data is available
  if (showDemo) {
    return (
      <div className="min-h-screen gradient-bg">
        <Header />
        <main className="pt-[77px] pb-16">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 mb-6">
              <div className="text-center">
                <div className="text-blue-500 text-6xl mb-4">🔍</div>
                <h1 className="text-2xl font-bold text-geo-slate-900 mb-4">Analysis Results</h1>
                <p className="text-gray-600 mb-6">
                  View detailed analysis results from multiple AI providers.
                  <br />
                  Start an analysis to see your personalized results here.
                </p>
                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => navigate("/")}
                    className="px-6 py-3 bg-geo-blue-500 text-white rounded-lg hover:bg-geo-blue-600 transition-colors font-semibold"
                  >
                    Start Analysis
                  </button>
                </div>
              </div>
            </div>
            
            {/* Show demo components */}
            <div className="mt-6">
              <CurrentTrends />
            </div>
            
            <div className="mt-6">
              <ImprovementRecommendations />
            </div>
            
            <div className="mt-6">
              <AnalysisSummary />
            </div>
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
          
          
          {/* Current Trends & Insights */}
          <div className="mt-6">
            <CurrentTrends />
          </div>
          
          {/* Improvement Recommendations */}
          <div className="mt-6">
            <ImprovementRecommendations />
          </div>
          
          {/* Provider Tabs */}
          <div className="mt-6">
            <ProviderTabs 
              providerItems={providerItems as Record<ProviderKey, ParsedResultItem[]>} 
              target={new URLSearchParams(location.search).get('target') || ''} 
            />
          </div>
          
          {/* Results List */}
          <div className="mt-6">
            <ResultsList providerItems={providerItems as Record<ProviderKey, ParsedResultItem[]>} />
          </div>
          
          {/* Analysis Summary */}
          <div className="mt-6">
            <AnalysisSummary />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
