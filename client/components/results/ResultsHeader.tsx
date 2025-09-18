import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Target, Clock, RotateCcw, List, Grid3X3, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { type ProviderKey, type ParsedResultItem } from "@/lib/api";
import { useLocation, useNavigate } from "react-router-dom";

export default function ResultsHeader({ providerItems }: { providerItems: Record<ProviderKey, ParsedResultItem[]> }) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const q = params.get('q') || 'best running shoes for flat feet';
  const target = params.get('target') || 'Nike Air Zoom Pegasus';

  const reanalyze = () => {
    // Trigger refetch by changing a non-semantic param (cache-bust)
    params.set('ts', String(Date.now()));
    navigate(`${location.pathname}?${params.toString()}`);
  };

  const [ranks, setRanks] = useState<Record<ProviderKey, number | null>>({
    claude: null, openai: null, perplexity: null, gemini: null
  });
  const [analysisTime, setAnalysisTime] = useState<Date>(new Date());

  useEffect(() => {
    const computeRank = (items: { title: string }[]) => {
      const idx = items.findIndex(i => i.title.toLowerCase().includes(target.toLowerCase()));
      return idx >= 0 ? idx + 1 : (items.length > 0 ? 1 : null);
    };
    setRanks({
      claude: computeRank(providerItems.claude || []),
      openai: computeRank(providerItems.openai || []),
      perplexity: computeRank(providerItems.perplexity || []),
      gemini: computeRank(providerItems.gemini || []),
    });
    setAnalysisTime(new Date());
  }, [providerItems, target]);

  // Calculate average rank
  const validRanks = Object.values(ranks).filter(rank => rank !== null) as number[];
  const averageRank = validRanks.length > 0 ? 
    (validRanks.reduce((sum, rank) => sum + rank, 0) / validRanks.length).toFixed(2) : 
    '--';

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
              <h1 className="text-xl font-bold text-geo-slate-900">"{q}"</h1>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-geo-slate-600">
              <div className="flex items-center gap-2">
                <Target className="w-[14px] h-[14px] text-amber-500" />
                <span><span className="text-geo-slate-600">Target:</span> <span className="font-bold text-geo-slate-900">{target}</span></span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-[14px] h-[14px] text-geo-slate-400" />
                <span>Analyzed {getTimeAgo(analysisTime)}</span>
              </div>
            </div>
          </div>

          <Button onClick={reanalyze} variant="secondary" className="h-10 px-5 bg-geo-slate-100 hover:bg-geo-slate-200 text-geo-slate-700 font-bold">
            <RotateCcw className="w-4 h-4 mr-2" />
            Re-analyze
          </Button>
        </div>
      </div>

      {/* Analysis Results Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="p-4 pb-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-geo-slate-900">Analysis Results</h2>
              <Badge className="bg-green-100 text-green-700 border-0 h-7 font-bold">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                Completed
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <Button 
                onClick={() => navigate(`/report?${params.toString()}`)}
                className="h-10 px-4 bg-geo-blue-500 hover:bg-geo-blue-600 text-white font-bold"
              >
                <FileText className="w-4 h-4 mr-2" />
                View Report
              </Button>
              <Button className="h-10 px-4 bg-slate-600 hover:bg-slate-700 text-white font-bold">
                <List className="w-4 h-4 mr-2" />
                List View
              </Button>
              <Button variant="secondary" className="h-10 px-4 bg-slate-200 hover:bg-slate-300 text-geo-slate-700 font-bold">
                <Grid3X3 className="w-4 h-4 mr-2" />
                Comparison View
              </Button>
            </div>
          </div>
        </div>

        {/* Provider Summary Cards */}
        <div className="px-6 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-geo-slate-700">Chat GPT</span>
                <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                  {ranks.openai ? `#${ranks.openai}` : '--'}
                </div>
              </div>
              <div className="text-xs text-geo-slate-600">{ranks.openai ? `${ranks.openai} of ${Math.max(5, ranks.openai)}` : 'Loading...'}</div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-geo-slate-700">Claude</span>
                <div className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded">
                  {ranks.claude ? `#${ranks.claude}` : '--'}
                </div>
              </div>
              <div className="text-xs text-geo-slate-600">{ranks.claude ? `${ranks.claude} of ${Math.max(5, ranks.claude)}` : 'Loading...'}</div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-geo-slate-700">Perplexity</span>
                <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                  {ranks.perplexity ? `#${ranks.perplexity}` : '--'}
                </div>
              </div>
              <div className="text-xs text-geo-slate-600">{ranks.perplexity ? `${ranks.perplexity} of ${Math.max(5, ranks.perplexity)}` : 'Loading...'}</div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-geo-slate-700">Gemini</span>
                <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                  {ranks.gemini ? `#${ranks.gemini}` : '--'}
                </div>
              </div>
              <div className="text-xs text-geo-slate-600">{ranks.gemini ? `${ranks.gemini} of ${Math.max(5, ranks.gemini)}` : 'Loading...'}</div>
            </div>

            <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-300 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-geo-slate-700">Average</span>
                <div className="bg-slate-700 text-white text-xs font-bold px-2 py-1 rounded">
                  #{averageRank}
                </div>
              </div>
              <div className="text-xs text-geo-slate-600">
                {averageRank === '--' ? 'Calculating...' : 
                 parseFloat(averageRank) <= 2 ? 'Excellent position' :
                 parseFloat(averageRank) <= 3 ? 'Good position' : 'Needs improvement'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

