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
}>();

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const [providerItems, setProviderItems] = useState<Partial<Record<ProviderKey, ParsedResultItem[]>>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef<string | null>(null);

  // Check if we have required parameters
  const params = new URLSearchParams(location.search);
  const q = params.get("q");
  const target = params.get("target");
  const hasRequiredParams = q && target;

  // Redirect to Start Analysis if no parameters provided (but only after checking cache)
  useEffect(() => {
    if (!hasRequiredParams) {
      navigate("/", { replace: true });
    }
  }, [hasRequiredParams, navigate]);

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
          timestamp: Date.now()
        });
      } catch (e) {
        setError((e as Error).message || "Failed to fetch results");
      } finally {
        setLoading(false);
      }
    })();
  }, [location.search, hasRequiredParams, q, target]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg">
        <Header />
        <main className="pt-[77px] pb-16">
          <div className="max-w-[1280px] mx-auto px-6">
            {/* Loading animation */}
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 mx-auto"></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-geo-blue-500 border-t-transparent mx-auto absolute top-0 left-1/2 transform -translate-x-1/2"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Results</h3>
                <p className="text-gray-600 mb-4">Fetching data from AI providers...</p>
                <div className="flex items-center justify-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-geo-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-geo-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-geo-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
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
