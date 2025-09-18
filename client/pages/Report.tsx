import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChartsSection from "@/components/results/charts/ChartsSection";
import AnalysisSummary from "@/components/results/AnalysisSummary";
import DownloadReport from "@/components/results/DownloadReport";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchAllProviderItems, type ProviderKey, type ParsedResultItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// Global cache to persist data across navigation (shared with Results page)
const resultsCache = new Map<string, {
  data: Record<ProviderKey, ParsedResultItem[]>;
  timestamp: number;
}>();

export default function Report() {
  const location = useLocation();
  const navigate = useNavigate();
  const [providerItems, setProviderItems] = useState<Partial<Record<ProviderKey, ParsedResultItem[]>>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check if we have required parameters
  const params = new URLSearchParams(location.search);
  const q = params.get("q");
  const target = params.get("target");
  const hasRequiredParams = q && target;

  // Fetch data for the report only if we have required parameters
  useEffect(() => {
    if (!hasRequiredParams) {
      setLoading(false);
      return;
    }
    
    const currentKey = `${q}-${target}`;
    
    // Check cache first
    const cachedResult = resultsCache.get(currentKey);
    const cacheAge = cachedResult ? Date.now() - cachedResult.timestamp : Infinity;
    const cacheValid = cacheAge < 5 * 60 * 1000; // 5 minutes cache validity
    
    if (cachedResult && cacheValid) {
      console.log('✅ Using cached data for report:', currentKey);
      setProviderItems(cachedResult.data);
      setLoading(false);
      setError(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    (async () => {
      try {
        const all = await fetchAllProviderItems(q!, target!);
        console.log('🔍 Report data:', all);
        setProviderItems(all);
        
        // Cache the results
        resultsCache.set(currentKey, {
          data: all,
          timestamp: Date.now()
        });
      } catch (e) {
        setError((e as Error).message || "Failed to fetch report data");
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
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-geo-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading report...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show demo state if no parameters provided
  if (!hasRequiredParams) {
    return (
      <div className="min-h-screen gradient-bg">
        <Header />
        <main className="pt-[77px] pb-16">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 mb-6">
              <div className="text-center">
                <div className="text-blue-500 text-6xl mb-4">📊</div>
                <h1 className="text-2xl font-bold text-geo-slate-900 mb-4">Analysis Report</h1>
                <p className="text-gray-600 mb-6">
                  View comprehensive analysis reports with charts, trends, and insights.
                  <br />
                  Start an analysis to generate your personalized report.
                </p>
                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => navigate("/")}
                    className="px-6 py-3 bg-geo-blue-500 text-white rounded-lg hover:bg-geo-blue-600 transition-colors font-semibold"
                  >
                    Start Analysis
                  </button>
                  <button 
                    onClick={() => {
                      // Always preserve query parameters when navigating to Results
                      const currentParams = new URLSearchParams(location.search);
                      navigate(`/results?${currentParams.toString()}`);
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                  >
                    View Results
                  </button>
                </div>
              </div>
            </div>
            
            {/* Show demo charts */}
            <div className="mb-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Sample Report Preview</h2>
                <p className="text-gray-500">Charts will be populated with your analysis data</p>
              </div>
              <ChartsSection />
            </div>
            
            <AnalysisSummary />
            <DownloadReport />
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

  const query = q || "";
  const targetParam = target || "";

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      
      {/* Main Content */}
      <main className="pt-[77px] pb-16">
        <div className="max-w-[1280px] mx-auto px-6">
          
          {/* Report Header */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate(`/results?${new URLSearchParams(location.search).toString()}`)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Results
                  </Button>
                </div>
                <h1 className="text-2xl font-bold text-geo-slate-900 mb-2">Analysis Report</h1>
                <p className="text-gray-600">
                  Comprehensive analysis for <span className="font-semibold text-geo-blue-600">"{query}"</span> 
                  targeting <span className="font-semibold text-geo-green-600">"{targetParam}"</span>
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Generated on</div>
                <div className="text-sm font-medium text-gray-700">
                  {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="mb-6">
            <ChartsSection />
          </div>
          
          {/* Analysis Summary */}
          <div className="mb-6">
            <AnalysisSummary />
          </div>
          
          {/* Download & Export Report */}
          <div>
            <DownloadReport />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
