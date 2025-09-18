import { Badge } from "@/components/ui/badge";
import { Star, Lightbulb, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { type ParsedResultItem, type ProviderKey } from "@/lib/api";
import { useLocation } from "react-router-dom";

export default function ResultsList({ providerItems }: { providerItems: Record<ProviderKey, ParsedResultItem[]> }) {
  const [items, setItems] = useState<ParsedResultItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const location = useLocation();
  
  // Update displayed items when provider changes (no API calls)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const provider = (params.get('provider') || 'claude') as ProviderKey;
    const items = providerItems[provider] || [];
    console.log(`🔍 ResultsList - Provider: ${provider}`, items);
    setItems(items);
    setLoading(false);
  }, [location.search, providerItems]);

  if (loading) {
    return <div className="space-y-4"><div className="bg-white rounded-xl border border-slate-200 p-6">Loading results…</div></div>;
  }

  const paramsForMap = new URLSearchParams(location.search);
  const activeTarget = (paramsForMap.get('target') || '').toLowerCase();
  const results = (items ?? []).map((it, idx) => ({
    id: idx + 1,
    ranking: `#${it.rank}`,
    rankingBg: idx === 0 ? "from-orange-500 to-orange-600" : idx === 1 ? "from-purple-500 to-purple-600" : "from-slate-600 to-slate-700",
    title: it.title,
    website: it.website || "",
    description: it.description,
    rating: it.rating || "",
    priceRange: it.priceRange || "",
    category: it.category || "",
    categoryColor: "bg-slate-100 text-slate-800",
    isTarget: activeTarget ? it.title.toLowerCase().includes(activeTarget) : false,
  }));

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <div 
          key={result.id} 
          className={`bg-white rounded-xl shadow-sm relative ${
            result.isTarget ? 'border-2 border-amber-300' : 'border border-slate-200'
          }`}
        >
          {result.isTarget && (
            <div className="absolute -top-3 right-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              TARGET MATCH
            </div>
          )}
          
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
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg border border-blue-300 flex items-center justify-center">
                      <span className="text-[8px] text-blue-600 font-bold">AI</span>
                    </div>
                    {result.website && <span className="text-geo-blue-500 font-medium">{result.website}</span>}
                  </div>
                </div>

                <p className="text-sm text-geo-slate-600 leading-relaxed">
                  {result.description}
                </p>

                <div className="flex items-center gap-6">
                  {result.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-[14px] h-[14px] fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-geo-slate-500">{result.rating}</span>
                    </div>
                  )}
                  {result.priceRange && (
                    <span className="text-xs text-geo-slate-500">{result.priceRange}</span>
                  )}
                  {result.category && (
                    <Badge className={`${result.categoryColor} border-0 text-xs`}>
                      {result.category}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Why this ranking button */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <details className="group">
                <summary className="flex items-center gap-2 text-geo-blue-500 text-sm font-medium hover:text-geo-blue-600 transition-colors cursor-pointer list-none group-open:mb-2">
                  <Lightbulb className="w-[11px] h-[11px] flex-shrink-0" />
                  <span>Why this ranking?</span>
                  <ChevronDown className="w-[14px] h-[14px] flex-shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-2 text-sm text-geo-slate-600 leading-relaxed">
                  {result.why || 'Ranked based on relevance, sentiment, and target match.'}
                </div>
              </details>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
