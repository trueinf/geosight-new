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

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const [providerItems, setProviderItems] = useState<Partial<Record<ProviderKey, ParsedResultItem[]>>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef<string | null>(null);

  // Guard: if user refreshes or navigates directly without params, send back to Start Analysis
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    const target = params.get("target");
    if (!q || !target) {
      navigate("/", { replace: true });
    }
  }, [location.search, navigate]);

  // Single fetch for all providers; pass down as props
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    const target = params.get("target");
    if (!q || !target) return;
    
    // Only fetch if we haven't fetched yet or if query/target changed
    const currentKey = `${q}-${target}`;
    console.log('🔍 Results useEffect triggered:', { currentKey, hasFetched: hasFetched.current });
    if (hasFetched.current === currentKey) {
      console.log('✅ Skipping fetch - already fetched for this key');
      return;
    }
    
    console.log('🚀 Making API calls for:', currentKey);
    setLoading(true);
    setError(null);
    hasFetched.current = currentKey;
    
    (async () => {
      try {
        const all = await fetchAllProviderItems(q, target);
        console.log('🔍 All provider items:', all);
        setProviderItems(all);
      } catch (e) {
        setError((e as Error).message || "Failed to fetch results");
      } finally {
        setLoading(false);
      }
    })();
  }, [location.search]);

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      
      {/* Main Content */}
      <main className="pt-[77px] pb-16">
        <div className="max-w-[1280px] mx-auto px-6">
          <ResultsHeader providerItems={providerItems as Record<ProviderKey, ParsedResultItem[]>} />
          
          {/* Charts Section */}
          <div className="mt-6">
            <VisibilityCharts 
              providerItems={providerItems as Record<ProviderKey, ParsedResultItem[]>} 
              target={new URLSearchParams(location.search).get('target') || ''} 
            />
          </div>
          
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
