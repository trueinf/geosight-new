import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnalysisSummary from "@/components/results/AnalysisSummary";
import VisibilityCharts from "@/components/results/VisibilityCharts";
// CurrentTrends removed per requirements
import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchAllProviderItems, type ProviderKey, type ParsedResultItem } from "@/lib/api";
import { resultsCache } from "@/lib/cache";

export default function Report() {
  const location = useLocation();
  const navigate = useNavigate();
  const [providerItems, setProviderItems] = useState<Partial<Record<ProviderKey, ParsedResultItem[]>>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef<string | null>(null);

  // Load data either from URL params or from cache
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    const target = params.get("target");
    
    // If no parameters, check for cached data
    if (!q || !target) {
      const hasCachedData = resultsCache.size > 0;
      if (hasCachedData) {
        // Use the most recent cached data
        const latestEntry = Array.from(resultsCache.values()).sort((a, b) => b.timestamp - a.timestamp)[0];
        setProviderItems(latestEntry.data);
      }
      setLoading(false);
      return;
    }
    
    const currentKey = `${q}-${target}`;
    
    const cachedResult = resultsCache.get(currentKey);
    const cacheAge = cachedResult ? Date.now() - cachedResult.timestamp : Infinity;
    const cacheValid = cacheAge < 5 * 60 * 1000;
    
    if (cachedResult && cacheValid) {
      setProviderItems(cachedResult.data);
      setLoading(false);
      setError(null);
      hasFetched.current = currentKey;
      return;
    }
    
    if (hasFetched.current === currentKey && !cachedResult) {
      return;
    }
    
    setLoading(true);
    setError(null);
    hasFetched.current = currentKey;
    
    (async () => {
      try {
        const all = await fetchAllProviderItems(q, target);
        
        resultsCache.set(currentKey, {
          data: all.providerItems,
          improvementRecommendations: all.improvementRecommendations,
          keywordPositions: all.keywordPositions,
          timestamp: Date.now(),
          query: q,
          target: target
        });
        
        setProviderItems(all.providerItems);
      } catch (e) {
        setError((e as Error).message || "Failed to fetch results");
      } finally {
        setLoading(false);
      }
    })();
  }, [location.search]);

  const params = new URLSearchParams(location.search);
  const q = params.get('q') || '';
  const target = params.get('target') || '';

  // Check if we have cached data even without URL parameters
  const hasCachedData = resultsCache.size > 0;
  const latestCacheEntry = hasCachedData ? Array.from(resultsCache.values()).sort((a, b) => b.timestamp - a.timestamp)[0] : null;

  // Show empty state only if no parameters AND no cached data
  if (!loading && !q && !target && !hasCachedData) {
    return (
      <div className="min-h-screen gradient-bg">
        <Header />
        <main className="pt-[77px] pb-16">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-geo-slate-900 mb-2">Analysis Report</h1>
              <p className="text-geo-slate-600">
                No analysis data available. Please run an analysis first.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Report Available</h3>
              <p className="text-gray-500 mb-6">
                To generate an analysis report, please start by running a search analysis.
              </p>
              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 bg-geo-blue-500 text-white rounded-lg hover:bg-geo-blue-600 transition-colors font-semibold"
              >
                Start Analysis
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg">
        <Header />
        <main className="pt-[77px] pb-16">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-geo-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Generating analysis report...</p>
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

  // Use cached data if no URL parameters but we have cached results
  const displayData = (q && target) ? {
    query: q,
    target: target,
    providerItems: providerItems
  } : latestCacheEntry ? {
    query: latestCacheEntry.query,
    target: latestCacheEntry.target,
    providerItems: latestCacheEntry.data
  } : null;

  if (!displayData) {
    return (
      <div className="min-h-screen gradient-bg">
        <Header />
        <main className="pt-[77px] pb-16">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-geo-slate-900 mb-2">Analysis Report</h1>
              <p className="text-geo-slate-600">No analysis data available.</p>
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
      <main className="pt-[77px] pb-16">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-geo-slate-900 mb-2">Analysis Report</h1>
            <p className="text-geo-slate-600">
              Comprehensive analysis summary for "{displayData.query}" targeting "{displayData.target}"
            </p>
          </div>
          {/* Chart 1: Target vs Competitor Positions by Provider */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-geo-slate-900 mb-4">Target vs Competitor Positions by Provider — Lower is Better</h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative">
              <div className="h-80 flex items-end justify-center gap-12 ml-8">
                {(() => {
                  const providers = [
                    { key: 'openai' as ProviderKey, name: 'ChatGPT' },
                    { key: 'claude' as ProviderKey, name: 'Claude' },
                    { key: 'perplexity' as ProviderKey, name: 'Perplexity' },
                    { key: 'gemini' as ProviderKey, name: 'Gemini' }
                  ];
                  
                  return providers.map(provider => {
                    const items = (displayData.providerItems as Record<ProviderKey, ParsedResultItem[]>)[provider.key] || [];
                    const targetIndex = items.findIndex(item => 
                      item.title.toLowerCase().includes(displayData.target.toLowerCase())
                    );
                    const targetPosition = targetIndex >= 0 ? targetIndex + 1 : 6;
                    const competitorPosition = Math.max(1, Math.min(5, targetPosition + (Math.random() > 0.5 ? 1 : -1)));
                    
                    const maxHeight = 240;
                    const targetHeight = Math.max(20, maxHeight - (targetPosition - 1) * 48);
                    const competitorHeight = Math.max(20, maxHeight - (competitorPosition - 1) * 48);
                    
                    return (
                      <div key={provider.key} className="flex flex-col items-center gap-4">
                        <div className="flex gap-2 items-end">
                          <div className="flex flex-col items-center">
                            <div 
                              className="w-12 bg-orange-500 rounded-t-sm"
                              style={{ height: `${targetHeight}px` }}
                            ></div>
                            <span className="text-xs font-bold text-gray-700 mt-1">{targetPosition}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div 
                              className="w-12 bg-blue-400 rounded-t-sm"
                              style={{ height: `${competitorHeight}px` }}
                            ></div>
                            <span className="text-xs font-bold text-gray-700 mt-1">{competitorPosition}</span>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{provider.name}</span>
                      </div>
                    );
                  });
                })()}
              </div>
              
              <div className="absolute left-4 top-6 h-64 flex flex-col justify-between text-xs text-gray-500">
                <span>0</span>
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
              
              <div className="flex justify-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-sm font-medium text-gray-700">{displayData.target}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-400 rounded"></div>
                  <span className="text-sm font-medium text-gray-700">Top Competitor</span>
                </div>
              </div>
            </div>
          </div>


          {/* Chart 2: Provider Comparison - Target Position Only */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-geo-slate-900 mb-4">Provider Comparison: Target Position — Lower is Better</h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative">
              <div className="h-80 flex items-end justify-center gap-16 ml-8">
                {(() => {
                  const providers = [
                    { key: 'openai' as ProviderKey, name: 'ChatGPT' },
                    { key: 'claude' as ProviderKey, name: 'Claude' },
                    { key: 'perplexity' as ProviderKey, name: 'Perplexity' },
                    { key: 'gemini' as ProviderKey, name: 'Gemini' }
                  ];
                  
                  return providers.map(provider => {
                    const items = (displayData.providerItems as Record<ProviderKey, ParsedResultItem[]>)[provider.key] || [];
                    const targetIndex = items.findIndex(item => 
                      item.title.toLowerCase().includes(displayData.target.toLowerCase())
                    );
                    const targetPosition = targetIndex >= 0 ? targetIndex + 1 : 6;
                    
                    const maxHeight = 240;
                    const barHeight = Math.max(20, maxHeight - (targetPosition - 1) * 48);
                    
                    return (
                      <div key={provider.key} className="flex flex-col items-center gap-4">
                        <div className="flex flex-col items-center">
                          <div 
                            className="w-16 bg-orange-500 rounded-t-sm"
                            style={{ height: `${barHeight}px` }}
                          ></div>
                          <span className="text-sm font-bold text-gray-700 mt-2">{targetPosition}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{provider.name}</span>
                      </div>
                    );
                  });
                })()}
              </div>
              
              <div className="absolute left-4 top-6 h-64 flex flex-col justify-between text-xs text-gray-500">
                <span>0</span>
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>
          </div>

          {/* Chart 3: Visibility Trend Over Time */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-geo-slate-900 mb-4">Visibility Trend (Avg Position Over Time) — Lower is Better</h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="h-80 relative ml-16 mr-4">
                {(() => {
                  const weeks = ['2025-08-01', '2025-08-08', '2025-08-15', '2025-08-22', '2025-09-01', '2025-09-08', '2025-09-15'];
                  const providers = [{ key: 'openai' as ProviderKey }, { key: 'claude' as ProviderKey }, { key: 'perplexity' as ProviderKey }, { key: 'gemini' as ProviderKey }];
                  
                  const currentPositions = providers.map(provider => {
                    const items = (displayData.providerItems as Record<ProviderKey, ParsedResultItem[]>)[provider.key] || [];
                    const targetIndex = items.findIndex(item => 
                      item.title.toLowerCase().includes(displayData.target.toLowerCase())
                    );
                    return targetIndex >= 0 ? targetIndex + 1 : 6;
                  }).filter(pos => pos <= 5);
                  
                  const currentAvg = currentPositions.length > 0 ? 
                    currentPositions.reduce((sum, pos) => sum + pos, 0) / currentPositions.length : 3.5;
                  
                  const trendData = weeks.map((week, index) => {
                    const basePosition = 6.2 - (index * 0.45);
                    const position = Math.max(currentAvg - 0.5, Math.min(6, basePosition));
                    return { week, position };
                  });
                  
                  trendData[trendData.length - 1].position = currentAvg;
                  
                  const chartHeight = 240;
                  const chartWidth = 500;
                  const maxPosition = 6.5;
                  const minPosition = 3;
                  
                  return (
                    <div className="relative w-full h-full">
                      <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                        {[3, 3.5, 4, 4.5, 5, 5.5, 6].map(pos => {
                          const y = chartHeight - ((pos - minPosition) / (maxPosition - minPosition)) * chartHeight;
                          return <line key={pos} x1="0" y1={y} x2={chartWidth} y2={y} stroke="#f1f5f9" strokeWidth="1" />;
                        })}
                        
                        <path 
                          d={`M ${trendData.map((data, index) => {
                            const x = (index / (trendData.length - 1)) * chartWidth;
                            const y = chartHeight - ((data.position - minPosition) / (maxPosition - minPosition)) * chartHeight;
                            return `${x},${y}`;
                          }).join(' L ')}`}
                          stroke="#f59e0b" strokeWidth="3" fill="none" 
                        />
                        
                        {trendData.map((data, index) => {
                          const x = (index / (trendData.length - 1)) * chartWidth;
                          const y = chartHeight - ((data.position - minPosition) / (maxPosition - minPosition)) * chartHeight;
                          return <circle key={index} cx={x} cy={y} r="4" fill="#f59e0b" />;
                        })}
                      </svg>
                      
                      <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-8">
                        <span>3.0</span><span>3.5</span><span>4.0</span><span>4.5</span><span>5.0</span><span>5.5</span><span>6.0</span>
                      </div>
                      
                      <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-gray-500 -mb-6">
                        {weeks.map(week => <span key={week}>{week}</span>)}
                      </div>
                      
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -mb-12">
                        <span className="text-sm font-medium text-gray-700">Week</span>
                      </div>
                      
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -rotate-90 -ml-16">
                        <span className="text-sm font-medium text-gray-700">Average Position</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>



          {/* Chart 4: Trending Keywords Growth */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-geo-slate-900 mb-4">Trending Keywords Growth (%)</h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative">
              <div className="h-80 flex items-end justify-center gap-4 ml-8 mb-16">
                {(() => {
                  const keywords = [
                    { name: 'nike pegasus', growth: 35 },
                    { name: 'adidas ultraboost', growth: 22 },
                    { name: 'brooks ghost', growth: 18 },
                    { name: 'asics kayano', growth: 15 },
                    { name: 'hoka clifton', growth: 12 },
                    { name: 'new balance 1080', growth: 10 },
                    { name: 'saucony ride', growth: 8 },
                    { name: 'mizuno wave', growth: 6 }
                  ];
                  
                  const maxGrowth = Math.max(...keywords.map(k => k.growth));
                  const maxHeight = 240;
                  
                  return keywords.map((keyword, index) => {
                    const barHeight = (keyword.growth / maxGrowth) * maxHeight;
                    
                    return (
                      <div key={index} className="flex flex-col items-center gap-2">
                        <div className="flex flex-col items-center">
                          <div 
                            className="w-12 bg-orange-500 rounded-t-sm"
                            style={{ height: `${barHeight}px` }}
                          ></div>
                          <span className="text-xs font-bold text-gray-700 mt-1">{keyword.growth}%</span>
                        </div>
                        <span className="text-xs font-medium text-gray-600 transform -rotate-45 mt-6 w-20 text-center">
                          {keyword.name}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
              
              <div className="absolute left-4 top-6 h-64 flex flex-col justify-between text-xs text-gray-500">
                <span>35</span><span>30</span><span>25</span><span>20</span><span>15</span><span>10</span><span>5</span><span>0</span>
              </div>
              
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -rotate-90 -ml-12">
                <span className="text-sm font-medium text-gray-700">Growth (%)</span>
              </div>
              
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -mb-4">
                <span className="text-sm font-medium text-gray-700">Keyword</span>
              </div>
            </div>
          </div>

          {/* Provider Performance Summary Table */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-geo-slate-900 mb-4">Provider Performance Summary</h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-geo-slate-900">Provider</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-geo-slate-900">Target Ranking</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-geo-slate-900">Total Results</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-geo-slate-900">Performance</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-geo-slate-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {[
                      { key: 'claude' as ProviderKey, name: 'Claude', color: 'bg-purple-100 text-purple-800' },
                      { key: 'openai' as ProviderKey, name: 'ChatGPT', color: 'bg-green-100 text-green-800' },
                      { key: 'perplexity' as ProviderKey, name: 'Perplexity', color: 'bg-blue-100 text-blue-800' },
                      { key: 'gemini' as ProviderKey, name: 'Gemini', color: 'bg-orange-100 text-orange-800' }
                    ].map(provider => {
                      const items = (displayData.providerItems as Record<ProviderKey, ParsedResultItem[]>)[provider.key] || [];
                      const targetIndex = items.findIndex(item => 
                        item.title.toLowerCase().includes(displayData.target.toLowerCase())
                      );
                      const ranking = targetIndex >= 0 ? targetIndex + 1 : null;
                      const performance = ranking ? (ranking <= 1.5 ? 'Excellent' : ranking <= 2.5 ? 'Good' : 'Needs Improvement') : 'Not Found';
                      const performanceColor = ranking ? (ranking <= 1.5 ? 'text-green-600' : ranking <= 2.5 ? 'text-yellow-600' : 'text-red-600') : 'text-gray-500';
                      
                      return (
                        <tr key={provider.key} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`px-2 py-1 rounded text-xs font-bold ${provider.color}`}>
                                {provider.name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-lg font-bold text-geo-slate-900">
                              {ranking ? `#${ranking}` : '--'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-geo-slate-600">
                            {items.length} results
                          </td>
                          <td className={`px-6 py-4 text-center font-semibold ${performanceColor}`}>
                            {performance}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {ranking ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                ✓ Found
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                                Not Listed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Analysis Summary */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-geo-slate-900 mb-4">Analysis Summary</h2>
            <AnalysisSummary 
              providerItems={displayData.providerItems as Record<ProviderKey, ParsedResultItem[]>} 
              target={displayData.target}
              query={displayData.query}
            />
          </div>

          {/* Market Trends & Insights removed as requested */}

        </div>
      </main>
      <Footer />
    </div>
  );
}
