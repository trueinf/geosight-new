import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, Lightbulb, ChevronDown, TrendingUp, Plus, Award, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { type ParsedResultItem, type ProviderKey, type RankingAnalysisResponse, type ImprovementRecommendation } from "@/lib/api";
import { useLocation } from "react-router-dom";

export default function ResultsList({ 
  providerItems, 
  improvementRecommendations, 
  keywordPositions 
}: { 
  providerItems: Record<ProviderKey, ParsedResultItem[]>;
  improvementRecommendations: Record<ProviderKey, ImprovementRecommendation[] | undefined>;
  keywordPositions: Record<ProviderKey, number | undefined>;
}) {
  const [items, setItems] = useState<ParsedResultItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showImproveModal, setShowImproveModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ParsedResultItem | null>(null);
  const [currentProviderRecommendations, setCurrentProviderRecommendations] = useState<ImprovementRecommendation[] | undefined>(undefined);
  const [jsonViewItem, setJsonViewItem] = useState<ParsedResultItem | null>(null);

  const location = useLocation();
  
  // Update displayed items when provider changes (no API calls)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const provider = (params.get('provider') || 'claude') as ProviderKey;
    const items = providerItems[provider] || [];
    const recommendations = improvementRecommendations[provider];
    console.log(`🔍 ResultsList - Provider: ${provider}`, { items, recommendations });
    console.log('🔍 Improvement recommendations debug:', {
      provider,
      hasRecommendations: !!recommendations,
      recommendationsLength: recommendations?.length || 0,
      recommendations: recommendations,
      allRecommendations: improvementRecommendations
    });
    
    // Debug: Log all providers and their recommendations
    Object.entries(improvementRecommendations).forEach(([p, recs]) => {
      console.log(`🔍 Provider ${p} recommendations:`, {
        hasRecommendations: !!recs,
        count: recs?.length || 0,
        recommendations: recs
      });
    });
    
    setItems(items);
    setCurrentProviderRecommendations(recommendations);
    setLoading(false);
  }, [location.search, providerItems, improvementRecommendations]);

  if (loading) {
    return <div className="space-y-4"><div className="bg-white rounded-xl border border-slate-200 p-6">Loading results…</div></div>;
  }

  const handleImproveClick = (item: ParsedResultItem) => {
    setSelectedItem(item);
    setShowImproveModal(true);
  };

  const params = new URLSearchParams(location.search);
  const currentProvider = (params.get('provider') || 'claude') as ProviderKey;

  console.log('🔍 ResultsList - Total items received:', items?.length);
  console.log('🔍 ResultsList - Items:', items?.map(item => ({ title: item.title, reasoning: item.rankingAnalysis?.llm_reasoning })));

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-geo-slate-900">Results</h3>
          <span className="text-sm text-geo-slate-600">({items?.length || 0} results)</span>
        </div>
        {(items ?? []).map((it, idx) => {
        const params = new URLSearchParams(location.search);
        const currentProvider = (params.get('provider') || 'claude') as ProviderKey;
        const providerRecommendations = improvementRecommendations[currentProvider];
        const hasRecommendations = providerRecommendations && providerRecommendations.length > 0;
        
        const currentPosition = idx + 1;
        const shouldShowButton = currentPosition !== 1 && hasRecommendations;

        const result = {
          id: idx + 1,
          ranking: `#${idx + 1}`,
          rankingBg: idx === 0 ? "from-orange-500 to-orange-600" : idx === 1 ? "from-purple-500 to-purple-600" : "from-slate-600 to-slate-700",
          title: it.title,
          website: it.website || "",
          description: it.description,
          rating: it.rating || "",
          priceRange: it.priceRange || "",
          category: it.category || "",
          categoryColor: "bg-slate-100 text-slate-800",
          shouldShowImproveButton: shouldShowButton,
        };

        return (
        <div 
          key={result.id} 
          className="rounded-xl shadow-sm relative bg-white border border-slate-200"
        >
          
          <div className="p-6">
            <div className="flex items-start gap-4">
              {/* Ranking */}
              <div className={`bg-gradient-to-br ${result.rankingBg} text-white text-lg font-bold w-12 h-8 rounded flex items-center justify-center flex-shrink-0`}>
                {result.ranking}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-bold text-geo-slate-900">{result.title}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    {it.isHilton && (
                      <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                        🏨 HILTON
                      </div>
                    )}
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg border border-blue-300 flex items-center justify-center">
                      <span className="text-[8px] text-blue-600 font-bold">AI</span>
                    </div>
                    {result.website && (
                      <a 
                        href={`https://${result.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-geo-blue-500 font-medium hover:text-geo-blue-600 hover:underline transition-colors cursor-pointer"
                      >
                        {result.website}
                      </a>
                    )}
                    {/* Debug: Show website info */}
                    {!result.website && (
                      <span className="text-xs text-gray-400">
                        No website data
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-geo-slate-600 leading-relaxed">
                  {result.description || 'No description available'}
                </p>

                <div className="flex items-center gap-6">
                  {/* Rating and price display removed - data still available in JSON */}
                  {result.category && (
                    <Badge className={`${result.categoryColor} border-0 text-xs`}>
                      {result.category}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <details className="group flex-1" key={`${currentProvider}-${it.rank}-${it.title}`}>
                  <summary className="flex items-center gap-2 text-geo-blue-500 text-sm font-medium hover:text-geo-blue-600 transition-colors cursor-pointer list-none group-open:mb-2">
                    <Lightbulb className="w-[11px] h-[11px] flex-shrink-0" />
                    <span>Why this ranking?</span>
                    <ChevronDown className="w-[14px] h-[14px] flex-shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-2 text-sm text-geo-slate-600 leading-relaxed">
                    {it.rankingAnalysis?.llm_reasoning ? (
                      <div className="bg-slate-800 rounded-lg p-4 text-white">
                        <div className="space-y-3">
                          {/* Matched Keywords */}
                          {it.rankingAnalysis.matched_keywords && it.rankingAnalysis.matched_keywords.length > 0 && (
                            <div className="flex items-start gap-3">
                              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div>
                                <div className="font-medium text-sm">Matched keywords:</div>
                                <div className="text-sm text-gray-300 italic">
                                  {it.rankingAnalysis.matched_keywords.join(', ')}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Authority */}
                          {(it.rankingAnalysis.citation_domains && it.rankingAnalysis.citation_domains.length > 0) || (Array.isArray(it.rankingAnalysis.major_reviews) ? it.rankingAnalysis.major_reviews.length > 0 : !!it.rankingAnalysis.major_reviews) ? (
                            <div className="flex items-start gap-3">
                              <div className="w-5 h-5 bg-white rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-3 h-3 text-slate-800" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <div className="font-medium text-sm">Authority:</div>
                                <div className="text-sm text-gray-300">
                                  {it.rankingAnalysis.citation_domains && it.rankingAnalysis.citation_domains.length > 0 ? it.rankingAnalysis.citation_domains.join(' + ') : ''}
                                  {Array.isArray(it.rankingAnalysis.major_reviews)
                                    ? (it.rankingAnalysis.major_reviews.length > 0 && ` + ${it.rankingAnalysis.major_reviews.join(', ')}`)
                                    : (it.rankingAnalysis.major_reviews && ` + ${it.rankingAnalysis.major_reviews}`)}
                                </div>
                              </div>
                            </div>
                          ) : null}

                          {/* Context */}
                          {it.rankingAnalysis.contextual_signals && it.rankingAnalysis.contextual_signals.length > 0 && (
                            <div className="flex items-start gap-3">
                              <div className="w-5 h-5 bg-white rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-3 h-3 text-slate-800" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div>
                                <div className="font-medium text-sm">Context:</div>
                                <div className="text-sm text-gray-300">
                                  {it.rankingAnalysis.contextual_signals.join('; ')}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Competitors */}
                          {it.rankingAnalysis.competitor_presence && it.rankingAnalysis.competitor_presence.length > 0 && (
                            <div className="flex items-start gap-3">
                              <div className="w-5 h-5 bg-white rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-3 h-3 text-slate-800" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                </svg>
                              </div>
                              <div>
                                <div className="font-medium text-sm">Competitors:</div>
                                <div className="text-sm text-gray-300">
                                  {it.rankingAnalysis.competitor_presence.join(', ')}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Reasoning */}
                          <div className="flex items-start gap-3">
                            <div className="w-5 h-5 bg-white rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-3 h-3 text-slate-800" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium text-sm">Reasoning:</div>
                              <div className="text-sm text-gray-300">
                                {it.rankingAnalysis.llm_reasoning}
                              </div>
                            </div>
                          </div>

                          {/* Sources */}
                          {it.rankingAnalysis.citation_domains && it.rankingAnalysis.citation_domains.length > 0 && (
                            <div className="flex items-start gap-3">
                              <div className="w-5 h-5 bg-white rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-3 h-3 text-slate-800" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div>
                                <div className="font-medium text-sm">Sources:</div>
                                <div className="text-sm text-gray-300">
                                  {it.rankingAnalysis.citation_domains.map((domain, index) => (
                                    <span key={domain}>
                                      <a 
                                        href={`https://${domain}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="underline hover:text-white transition-colors"
                                      >
                                        {domain}
                                      </a>
                                      {index < it.rankingAnalysis.citation_domains.length - 1 && ' ↗ | '}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                        <div className="text-red-800 font-medium mb-2">⚠️ Ranking analysis not available</div>
                        <div className="text-red-600 text-sm">
                          <p>Item: {it.title}</p>
                          <p>Rank: #{it.rank}</p>
                          <p>Provider: {currentProvider}</p>
                          <p>Has rankingAnalysis: {it.rankingAnalysis ? 'Yes' : 'No'}</p>
                          {it.rankingAnalysis && (
                            <div className="mt-2">
                              <p>Available keys: {Object.keys(it.rankingAnalysis).join(', ')}</p>
                              <p>Has llm_reasoning: {it.rankingAnalysis.llm_reasoning ? 'Yes' : 'No'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {/* View JSON Response button */}
                    <div className="mt-4 flex justify-end">
                      <Button 
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1.5"
                        onClick={(e) => {
                          e.preventDefault();
                          setJsonViewItem(it);
                        }}
                      >
                        View JSON Response
                      </Button>
                    </div>
                  </div>
                </details>
                
                {/* How to Improve button - show when target is NOT at #1 position */}
                {result.shouldShowImproveButton && (
                  <Button 
                    onClick={() => handleImproveClick(it)}
                    size="sm"
                    className="ml-4 bg-geo-blue-500 hover:bg-geo-blue-600 text-white text-xs px-3 py-1.5"
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    How to Improve
                  </Button>
                )}
                
                {/* Debug: Show when button should appear but doesn't have recommendations */}
                {result.shouldShowImproveButton && !hasRecommendations && (
                  <div className="ml-4 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    Button should show but no recommendations
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        );
      })}
      </div>

      {/* How to Improve Modal */}
      <Dialog open={showImproveModal} onOpenChange={setShowImproveModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <TrendingUp className="w-6 h-6 text-amber-500" />
              How to Improve {selectedItem?.title} Ranking
            </DialogTitle>
          </DialogHeader>
          
          {(() => {
            const params = new URLSearchParams(location.search);
            const currentProvider = (params.get('provider') || 'claude') as ProviderKey;
            const providerRecommendations = improvementRecommendations[currentProvider];
            return providerRecommendations && providerRecommendations.length > 0;
          })() ? (
            <div className="mt-4">
              {/* Group recommendations by category */}
              {(() => {
                const params = new URLSearchParams(location.search);
                const currentProvider = (params.get('provider') || 'claude') as ProviderKey;
                const providerRecommendations = improvementRecommendations[currentProvider];
                const grouped = (Array.isArray(providerRecommendations) ? providerRecommendations : []).reduce((acc, rec) => {
                  if (!acc[rec.category]) acc[rec.category] = [];
                  acc[rec.category].push(rec);
                  return acc;
                }, {} as Record<string, ImprovementRecommendation[]>);
                
                const categoryIcons = {
                  "SEO & Content Strategy": <Plus className="w-5 h-5 text-green-500" />,
                  "Authority & Citation Strategy": <Award className="w-5 h-5 text-blue-500" />,
                  "Brand Strategy": <Star className="w-5 h-5 text-amber-500" />,
                  "Technical Improvements": <CheckCircle className="w-5 h-5 text-purple-500" />
                };
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(grouped).map(([category, recommendations]) => (
                      <div key={category} className="space-y-4">
                        <div className="flex items-center gap-2 mb-3">
                          {categoryIcons[category as keyof typeof categoryIcons] || <Plus className="w-5 h-5 text-gray-500" />}
                          <h3 className="text-lg font-semibold text-gray-800">{category}</h3>
                        </div>
                        
                        <div className="space-y-3">
                          {recommendations.map((rec, idx) => (
                            <div key={idx} className="space-y-2">
                              <div className="flex items-start gap-3">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-800">{rec.title}</div>
                                  <div className="text-xs text-gray-600 mt-1">{rec.description}</div>
                                  <div className="flex gap-2 mt-2">
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      rec.timeframe === 'immediate' ? 'bg-red-100 text-red-700' :
                                      rec.timeframe === 'mid-term' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-green-100 text-green-700'
                                    }`}>
                                      {rec.timeframe}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                      {rec.expectedImpact}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="mt-4 text-center py-8">
              <div className="text-gray-500 mb-2">No improvement recommendations available</div>
              <div className="text-sm text-gray-400">
                {selectedItem?.title} may already be ranked #1 or improvement data is not available for this provider.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

  {/* JSON Viewer Modal */}
  <Dialog open={jsonViewItem !== null} onOpenChange={(open) => !open && setJsonViewItem(null)}>
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">Ranking JSON Response</DialogTitle>
      </DialogHeader>
      <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-xs">
        <pre className="whitespace-pre-wrap break-words">
{JSON.stringify(jsonViewItem, null, 2)}
        </pre>
      </div>
    </DialogContent>
  </Dialog>
    </div>
  );
}
