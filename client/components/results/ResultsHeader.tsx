import { Badge } from "@/components/ui/badge";
import { Search, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { type ProviderKey, type ParsedResultItem } from "@/lib/api";
import { useLocation } from "react-router-dom";

export default function ResultsHeader({ providerItems = {} }: { providerItems?: Record<ProviderKey, ParsedResultItem[]> }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const keywords = params.get('keywords') || '';
  const keywordList = keywords ? keywords.split(',').filter(k => k.trim()) : [];

  const [analysisTime, setAnalysisTime] = useState<Date>(new Date());

  useEffect(() => {
    setAnalysisTime(new Date());
  }, [providerItems]);

  const [ranks] = useState<Record<ProviderKey, number | null>>({
    claude: null, openai: null, perplexity: null, gemini: null
  });
  
  const totalProviders = 4;
  const averageRank = '--';

  // Calculate time ago
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="space-y-6">
      {/* Query Info Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-geo-blue-500" />
              <div>
                <h1 className="text-xl font-bold text-geo-slate-900 mb-2">Keywords Analysis</h1>
                <div className="flex flex-wrap gap-2">
                  {keywordList.length > 0 ? (
                    keywordList.map((keyword, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200">
                        {keyword.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-geo-slate-500">No keywords specified</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-geo-slate-600">
              <div className="flex items-center gap-2">
                <Clock className="w-[14px] h-[14px] text-geo-slate-400" />
                <span>Analyzed {getTimeAgo(analysisTime)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Results Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="p-4 pb-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-geo-slate-900">Results</h2>
              <Badge className={`border-0 h-7 font-bold ${
                Object.values(providerItems).some(items => items && items.length > 0) 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  Object.values(providerItems).some(items => items && items.length > 0) 
                    ? 'bg-green-500' 
                    : 'bg-yellow-500'
                }`}></div>
                {Object.values(providerItems).some(items => items && items.length > 0) ? 'Completed' : 'Loading...'}
              </Badge>
            </div>

          </div>
        </div>

        {/* Provider Summary Cards */}
        <div className="px-6 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-bold text-geo-slate-700">ChatGPT</span>
                <div className="bg-green-500 text-white text-sm font-bold px-3 py-2 rounded">
                  {ranks.openai ? `#${ranks.openai}` : '--'}
                </div>
              </div>
              <div className="text-sm text-geo-slate-600">{ranks.openai ? `${ranks.openai} of ${Math.max(5, ranks.openai)}` : 'Not available'}</div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-bold text-geo-slate-700">Claude</span>
                <div className="bg-purple-500 text-white text-sm font-bold px-3 py-2 rounded">
                  {ranks.claude ? `#${ranks.claude}` : '--'}
                </div>
              </div>
              <div className="text-sm text-geo-slate-600">{ranks.claude ? `${ranks.claude} of ${Math.max(5, ranks.claude)}` : 'Not available'}</div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-bold text-geo-slate-700">Perplexity</span>
                <div className="bg-blue-500 text-white text-sm font-bold px-3 py-2 rounded">
                  {ranks.perplexity ? `#${ranks.perplexity}` : '--'}
                </div>
              </div>
              <div className="text-sm text-geo-slate-600">{ranks.perplexity ? `${ranks.perplexity} of ${Math.max(5, ranks.perplexity)}` : 'Not available'}</div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-bold text-geo-slate-700">Gemini</span>
                <div className="bg-orange-500 text-white text-sm font-bold px-3 py-2 rounded">
                  {ranks.gemini ? `#${ranks.gemini}` : '--'}
                </div>
              </div>
              <div className="text-sm text-geo-slate-600">{ranks.gemini ? `${ranks.gemini} of ${Math.max(5, ranks.gemini)}` : 'Not available'}</div>
            </div>

            <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-300 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-bold text-geo-slate-700">Average</span>
                <div className="bg-slate-700 text-white text-sm font-bold px-3 py-2 rounded">
                  #{averageRank}
                </div>
              </div>
              <div className="text-sm text-geo-slate-600">
                {averageRank === '--' ? 'Not found' : 
                 parseFloat(averageRank) <= 1.5 ? 'Excellent position' :
                 parseFloat(averageRank) <= 2.5 ? 'Good position' : 'Needs improvement'}
              </div>
              {/* Show API status warnings */}
              {Object.entries(ranks).some(([provider, rank]) => rank === null && (providerItems[provider as ProviderKey]?.length === 0)) && (
                <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  Some providers unavailable (check API credits)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

