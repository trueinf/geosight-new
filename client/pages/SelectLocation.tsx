import { useState, useRef, useEffect } from "react";
import { MapPin, Play, Loader2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { type ProviderKey, type ParsedResultItem, type ImprovementRecommendation, fetchProviderResults, parseStrictListResponse } from "@/lib/api";
import FullPageSpinner from "@/components/FullPageSpinner";

const locations = [
  "Honolulu",
  "San Francisco", 
  "New York",
  "New Orleans",
  "Dallas",
  "Chicago",
  "Orlando",
  "Houston",
  "London",
  "Washington, D.C."
];

// Hotel query types
const hotelQueries = [
  "best hotels",
  "best luxury hotels", 
  "best business hotels",
  "best family hotels"
];

export default function SelectLocation() {
  const location = useLocation();
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisStarted, setAnalysisStarted] = useState<boolean>(false);
  
  // Results state for all hotel query types
  const [hotelResults, setHotelResults] = useState<Record<string, Record<ProviderKey, ParsedResultItem[]>>>({});
  const [improvementRecommendations, setImprovementRecommendations] = useState<Record<string, Record<ProviderKey, ImprovementRecommendation[] | undefined>>>({});
  const [keywordPositions, setKeywordPositions] = useState<Record<string, Record<ProviderKey, number | undefined>>>({});
  
  // Track selected provider from URL
  const [selectedProvider, setSelectedProvider] = useState<ProviderKey>('claude');
  
  const isFetching = useRef<boolean>(false);

  // Listen to URL changes for provider selection
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const provider = (params.get('provider') || 'claude') as ProviderKey;
    setSelectedProvider(provider);
  }, [location.search]);

  // Parse comprehensive response into categories using the fixed API parsing logic
  const parseComprehensiveResponse = (text: string, selectedLocation: string, rankingAnalysis?: any[]) => {
    console.log('🔍 Parsing comprehensive response with fixed API logic');
    console.log('🔍 rankingAnalysis length:', rankingAnalysis?.length || 0);
    
    // Use the fixed API parsing logic that properly categorizes and limits to 5 per category
    const allItems = parseStrictListResponse(text, rankingAnalysis, 20);
    console.log('🔍 Total items parsed:', allItems.length);
    
    // Group items by category based on rankingAnalysis
    const categories: Record<string, ParsedResultItem[]> = {
      [`best hotels in ${selectedLocation}`]: [],
      [`best luxury hotels in ${selectedLocation}`]: [],
      [`best business hotels in ${selectedLocation}`]: [],
      [`best family hotels in ${selectedLocation}`]: []
    };
    
    // Categorize items based on their position in the rankingAnalysis array
    // Since the API returns 20 items in order: 1-5 (Best Hotels), 6-10 (Luxury), 11-15 (Business), 16-20 (Family)
    allItems.forEach((item, index) => {
      let category = `best hotels in ${selectedLocation}`;
      
      // Group by position: 0-4 (Best Hotels), 5-9 (Luxury), 10-14 (Business), 15-19 (Family)
      if (index >= 0 && index <= 4) {
        category = `best hotels in ${selectedLocation}`;
      } else if (index >= 5 && index <= 9) {
        category = `best luxury hotels in ${selectedLocation}`;
      } else if (index >= 10 && index <= 14) {
        category = `best business hotels in ${selectedLocation}`;
      } else if (index >= 15 && index <= 19) {
        category = `best family hotels in ${selectedLocation}`;
      }
      
      if (categories[category] && categories[category].length < 5) {
        categories[category].push(item);
        console.log(`🔍 Added ${item.title} to ${category} (${categories[category].length}/5) - index ${index}`);
      }
    });

    console.log('🔍 Final categories:', Object.fromEntries(
      Object.entries(categories).map(([key, items]) => [key, `${items.length} items`])
    ));

    return categories;
  };

  // Generate comprehensive query for all hotel types
  const generateComprehensiveQuery = (location: string) => {
    return `List 20 different hotels in ${location} in 4 categories:

BEST HOTELS IN ${location.toUpperCase()}
1. Title: Hotel Name
Description: Brief description
Rating: X.X/5
Price: $X-$Y
Website: site.com

2. Title: Hotel Name
Description: Brief description
Rating: X.X/5
Price: $X-$Y
Website: site.com

3. Title: Hotel Name
Description: Brief description
Rating: X.X/5
Price: $X-$Y
Website: site.com

4. Title: Hotel Name
Description: Brief description
Rating: X.X/5
Price: $X-$Y
Website: site.com

5. Title: Hotel Name
Description: Brief description
Rating: X.X/5
Price: $X-$Y
Website: site.com

BEST LUXURY HOTELS IN ${location.toUpperCase()}
5 different luxury hotels

BEST BUSINESS HOTELS IN ${location.toUpperCase()}
5 different business hotels

BEST FAMILY HOTELS IN ${location.toUpperCase()}
5 different family hotels

Requirements: 20 unique hotels total, detailed descriptions.`;
  };

  // Handle start analysis
  const handleStartAnalysis = async () => {
    if (!selectedLocation || isFetching.current) return;
    
    setLoading(true);
    setError(null);
    setAnalysisStarted(true);
    isFetching.current = true;
    
    try {
      const comprehensiveQuery = generateComprehensiveQuery(selectedLocation);
      console.log(`🏨 Fetching comprehensive hotel results for: ${selectedLocation}`);
      
      const providers: ProviderKey[] = ["claude", "openai", "gemini", "perplexity"];
      const organizedResults: Record<string, Record<ProviderKey, ParsedResultItem[]>> = {};
      const organizedRecommendations: Record<string, Record<ProviderKey, ImprovementRecommendation[] | undefined>> = {};
      const organizedKeywordPositions: Record<string, Record<ProviderKey, number | undefined>> = {};
      
      // Initialize all 4 categories
      hotelQueries.forEach(queryType => {
        const categoryKey = `${queryType} in ${selectedLocation}`;
        organizedResults[categoryKey] = {
          claude: [],
          openai: [],
          perplexity: [],
          gemini: []
        };
        organizedRecommendations[categoryKey] = {
          claude: undefined,
          openai: undefined,
          perplexity: undefined,
          gemini: undefined
        };
        organizedKeywordPositions[categoryKey] = {
          claude: undefined,
          openai: undefined,
          perplexity: undefined,
          gemini: undefined
        };
      });
      
      // Fetch from all providers in parallel
      const providerPromises = providers.map(async (provider) => {
        try {
          console.log(`🔍 Fetching comprehensive data from ${provider}...`);
          const result = await fetchProviderResults(provider, comprehensiveQuery, selectedLocation, 'select_location');
          
          // Parse the comprehensive response into categories
          const categorizedResults = parseComprehensiveResponse(result.text, selectedLocation, result.rankingAnalysis);
          
          return { provider, result, categorizedResults };
        } catch (err) {
          console.error(`Failed to fetch from ${provider}:`, err);
          return { provider, result: null, categorizedResults: {} };
        }
      });

      // Wait for all providers to complete
      const providerResults = await Promise.all(providerPromises);
      
      // Distribute results across all categories
      providerResults.forEach(({ provider, result, categorizedResults }) => {
        console.log(`🔍 PROCESSING ${provider.toUpperCase()}:`);
        console.log(`🔍 Raw text length: ${result?.text?.length || 0}`);
        console.log(`🔍 Text preview: ${result?.text?.substring(0, 500) || 'NO TEXT'}`);
        console.log(`🔍 Categorized results keys: ${Object.keys(categorizedResults || {})}`);
        console.log(`🔍 Full text for ${provider}:`, result?.text);
        
        if (result) {
          let items: ParsedResultItem[] = [];
          
          // Always try structured parsing first for all providers
          if (Object.keys(categorizedResults).length > 0) {
            console.log(`🔍 Found ${Object.keys(categorizedResults).length} structured categories from ${provider}`);
            
            // Check if we got real hotels or just category names
            let hasRealHotels = false;
            Object.values(categorizedResults).forEach(categoryItems => {
              categoryItems.forEach(item => {
                if (item.title && !item.title.toLowerCase().includes('best') && !item.title.toLowerCase().includes('category')) {
                  hasRealHotels = true;
                }
              });
            });
            
            if (hasRealHotels) {
              Object.entries(categorizedResults).forEach(([categoryKey, categoryItems]) => {
                if (organizedResults[categoryKey]) {
                  organizedResults[categoryKey][provider] = categoryItems;
                  organizedRecommendations[categoryKey][provider] = result.improvementRecommendations;
                  organizedKeywordPositions[categoryKey][provider] = result.keywordPosition;
                  console.log(`🔍 Used structured results: ${categoryItems.length} items for ${provider} - ${categoryKey}`);
                }
              });
            } else {
              console.log(`🔍 ${provider} structured results contain category names, not hotels. Falling back to text parsing.`);
              categorizedResults = {}; // Clear to trigger fallback
            }
          }
          
          if (Object.keys(categorizedResults).length === 0) {
            console.log(`🔍 No structured categories found for ${provider} - this shouldn't happen with our new prompt!`);
            console.log(`🔍 ${provider} text preview:`, result.text.substring(0, 500));
          }
        }
      });
      
      setHotelResults(organizedResults);
      setImprovementRecommendations(organizedRecommendations);
      setKeywordPositions(organizedKeywordPositions);
      
    } catch (err) {
      console.error('Error fetching hotel results:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch results');
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  // Combine all results for provider tabs display
  const combinedProviderItems: Record<ProviderKey, ParsedResultItem[]> = {
    claude: [],
    openai: [],
    perplexity: [],
    gemini: []
  };

  // Flatten all hotel results into combined provider items
  Object.values(hotelResults).forEach(queryResults => {
    Object.entries(queryResults).forEach(([provider, items]) => {
      // Items are already limited to 5 per category by API parsing
      combinedProviderItems[provider as ProviderKey].push(...items);
    });
  });
  
  // Debug: Log total items per provider
  Object.entries(combinedProviderItems).forEach(([provider, items]) => {
    console.log(`🔍 ${provider} total items: ${items.length}`);
  });

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      
      {/* Main Content */}
      <main className="pt-[77px] pb-16">
        <div className="max-w-[1280px] mx-auto px-6">
          
          {/* Page Header */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-geo-blue-500 to-geo-blue-800 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-geo-slate-900 mb-2">Select Location</h1>
                <p className="text-geo-slate-600">Choose a location to customize your search results and analysis.</p>
              </div>
            </div>
            
            {/* Location Selector */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-geo-slate-900 mb-3">
                Choose Location
              </label>
              <div className="flex items-center gap-4">
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Select a location..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  disabled={!selectedLocation || loading}
                  onClick={handleStartAnalysis}
                  className="px-6 py-2 bg-gradient-to-r from-geo-blue-500 to-geo-blue-800 hover:from-geo-blue-600 hover:to-geo-blue-900 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Analysis
                    </>
                  )}
                </Button>
              </div>
              
              {selectedLocation && (
                <div className="mt-4 p-4 bg-geo-blue-50 border border-geo-blue-200 rounded-lg">
                  <p className="text-geo-blue-800 font-medium">
                    Selected Location: <span className="font-bold">{selectedLocation}</span>
                  </p>
                  <p className="text-geo-blue-600 text-sm mt-1">
                    Analysis results will be customized for this location.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
              <h3 className="text-red-800 font-semibold mb-2">Error</h3>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Provider Tabs Section */}
          {analysisStarted && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-geo-slate-900 mb-2">Hotel Analysis Results</h2>
                <p className="text-geo-slate-600">
                  Analyzing hotel options in {selectedLocation}
                </p>
              </div>
              
              {/* LLM Provider Tabs - Custom without numbers */}
              <div className="border-b border-slate-200">
                <div className="flex space-x-1 p-4">
                  {(['claude', 'openai', 'perplexity', 'gemini'] as ProviderKey[]).map((provider) => {
                    const isActive = selectedProvider === provider;
                    const itemCount = combinedProviderItems[provider]?.length || 0;
                    
                    const providerConfig = {
                      claude: { name: 'Claude', icon: '💬', color: 'text-green-600' },
                      openai: { name: 'ChatGPT', icon: '✨', color: 'text-purple-600' },
                      perplexity: { name: 'Perplexity', icon: '🔍', color: 'text-blue-600' },
                      gemini: { name: 'Gemini', icon: '💎', color: 'text-orange-600' }
                    };
                    
                    return (
                      <button
                        key={provider}
                        onClick={() => {
                          setSelectedProvider(provider);
                          const url = new URL(window.location.href);
                          url.searchParams.set('provider', provider);
                          window.history.replaceState({}, '', url);
                        }}
                        className={`
                          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                          ${isActive 
                            ? 'bg-white border-2 border-slate-300 shadow-sm' 
                            : 'hover:bg-slate-50 border-2 border-transparent'
                          }
                        `}
                      >
                        <span className="text-lg">{providerConfig[provider].icon}</span>
                        <span className={`font-semibold ${providerConfig[provider].color}`}>
                          {providerConfig[provider].name}
                        </span>
                        <span className="text-sm text-slate-500">
                          ({itemCount} results)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Hotel Results by Category - Filtered by Selected Provider */}
              <div className="p-6">
                {Object.keys(hotelResults).length > 0 ? (
                  <div className="space-y-8">
                    {Object.entries(hotelResults).map(([query, queryResults]) => {
                      const providerItems = queryResults[selectedProvider] || [];
                      
                      console.log(`🔍 UI Render - Query: ${query}, Provider: ${selectedProvider}, Items:`, providerItems);
                      
                      return (
                        <div key={query} className="border-b border-slate-200 pb-6 last:border-b-0">
                          <h3 className="text-lg font-semibold text-geo-slate-900 mb-4 capitalize">
                            {query.replace(`in ${selectedLocation}`, '').trim()}
                          </h3>
                          
                          {/* Results in card format like Results page */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                              <h4 className="font-semibold text-geo-slate-900 capitalize">{selectedProvider}</h4>
                              <div className="text-sm text-geo-slate-600">
                                ({providerItems.length} results)
                              </div>
                            </div>
                            
                            {providerItems.length > 0 ? (
                              <div className="space-y-4">
                                {providerItems.map((item, index) => (
                                  <div 
                                    key={index}
                                    className={`${item.isHilton 
                                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400 shadow-lg' 
                                      : 'bg-white border border-slate-200 shadow-sm'
                                    } rounded-xl relative`}
                                  >
                                    {item.isHilton && (
                                      <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                                        🏨 HILTON
                                      </div>
                                    )}
                                   <div className="p-6">
                                     <div className="flex items-start gap-4">
                                       {/* Ranking */}
                                       <div className="bg-gradient-to-br from-geo-blue-500 to-geo-blue-700 text-white text-lg font-bold w-12 h-8 rounded flex items-center justify-center flex-shrink-0">
                                         {index + 1}
                                       </div>

                                       {/* Content */}
                                       <div className="flex-1 space-y-3">
                                         <div className="flex items-start justify-between">
                                           <h3 className="text-lg font-bold text-geo-slate-900">{item.title}</h3>
                                           <div className="flex items-center gap-2 text-sm">
                                             <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg border border-blue-300 flex items-center justify-center">
                                               <span className="text-[8px] text-blue-600 font-bold">AI</span>
                                             </div>
                                           </div>
                                         </div>

                                         <p className="text-sm text-geo-slate-600 leading-relaxed">
                                           {item.description}
                                         </p>

                                       </div>
                                     </div>
                                   </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-geo-slate-500">
                                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                  <span className="text-slate-400">?</span>
                                </div>
                                <p>No results from {selectedProvider}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : !loading && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-geo-slate-900 mb-2">No Results Yet</h3>
                    <p className="text-geo-slate-600">
                      Click "Start Analysis" to fetch hotel recommendations.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State - Show when no analysis started */}
          {!analysisStarted && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-geo-slate-900 mb-2">
                {selectedLocation ? "Ready for Analysis" : "No Location Selected"}
              </h3>
              <p className="text-geo-slate-600 max-w-md mx-auto">
                {selectedLocation 
                  ? `Location set to ${selectedLocation}. Click "Start Analysis" to get hotel recommendations from different AI providers.`
                  : "Please select a location from the dropdown above to begin your hotel analysis."
                }
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
      
      {/* Full Page Spinner - Show when analysis is in progress */}
      <FullPageSpinner 
        isVisible={loading && analysisStarted} 
      />
    </div>
  );
}