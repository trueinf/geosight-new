import { TrendingUp, BarChart } from "lucide-react";
import { type ProviderKey, type ParsedResultItem } from "@/lib/api";

interface VisibilityChartsProps {
  providerItems: Record<ProviderKey, ParsedResultItem[]>;
  target: string;
}

export default function VisibilityCharts({ providerItems, target }: VisibilityChartsProps) {
  // Generate mock visibility data based on real rankings
  const generateVisibilityData = () => {
    const months = ['Feb', 'Mar', 'Apr', 'May'];
    const data = months.map((month, index) => {
      // Simulate visibility trends based on current rankings
      const baseVisibility = 100 - (index * 5); // Slight downward trend
      const targetVisibility = baseVisibility + Math.random() * 20 - 10; // Add some randomness
      const competitorVisibility = baseVisibility + Math.random() * 15 - 7;
      
      return {
        month,
        target: Math.max(0, Math.min(100, targetVisibility)),
        competitor: Math.max(0, Math.min(100, competitorVisibility))
      };
    });
    return data;
  };

  const visibilityData = generateVisibilityData();

  // Calculate provider performance metrics
  const getProviderMetrics = () => {
    const providers = [
      { key: 'claude' as ProviderKey, name: 'Claude', color: 'bg-purple-500' },
      { key: 'openai' as ProviderKey, name: 'ChatGPT', color: 'bg-green-500' },
      { key: 'perplexity' as ProviderKey, name: 'Perplexity', color: 'bg-blue-500' },
      { key: 'gemini' as ProviderKey, name: 'Gemini', color: 'bg-orange-500' }
    ];

    return providers.map(provider => {
      const items = providerItems[provider.key] || [];
      const targetRank = items.findIndex(item => 
        item.title.toLowerCase().includes(target.toLowerCase())
      );
      const score = targetRank >= 0 ? (5 - targetRank) * 20 : 0; // Convert rank to score (0-100)
      
      return {
        ...provider,
        score: Math.max(0, Math.min(100, score)),
        rank: targetRank >= 0 ? targetRank + 1 : null
      };
    });
  };

  const providerMetrics = getProviderMetrics();

  return (
    <div className="flex gap-6">
      {/* Visibility Trends Chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex-1">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-[18px] h-[18px] text-geo-blue-500" />
          <h3 className="text-lg font-bold text-geo-slate-900">Visibility Trends</h3>
        </div>
        
        <div className="h-[277px] relative">
          {/* Simple line chart */}
          <div className="absolute inset-0 flex items-end justify-between px-4 pb-8">
            {visibilityData.map((data, index) => (
              <div key={data.month} className="flex flex-col items-center space-y-2">
                <div className="flex flex-col items-center space-y-1">
                  {/* Target line */}
                  <div 
                    className="w-1 bg-green-500 rounded-full"
                    style={{ height: `${data.target}%` }}
                  ></div>
                  {/* Competitor line */}
                  <div 
                    className="w-1 bg-orange-500 rounded-full"
                    style={{ height: `${data.competitor}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600">{data.month}</span>
              </div>
            ))}
          </div>
          
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
            <span>100</span>
            <span>75</span>
            <span>50</span>
            <span>25</span>
            <span>0</span>
          </div>
          
          {/* Legend */}
          <div className="absolute bottom-2 left-4 flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-xs text-gray-600">{target}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-xs text-gray-600">Competitors</span>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Comparison Chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex-1">
        <div className="flex items-center gap-2 mb-4">
          <BarChart className="w-[18px] h-[18px] text-geo-blue-500" />
          <h3 className="text-lg font-bold text-geo-slate-900">Provider Comparison</h3>
        </div>
        
        <div className="h-[277px] relative">
          {/* Bar chart */}
          <div className="absolute inset-0 flex items-end justify-between px-4 pb-8">
            {providerMetrics.map((provider, index) => (
              <div key={provider.key} className="flex flex-col items-center space-y-2">
                <div className="flex flex-col items-center space-y-1">
                  <div 
                    className={`w-8 ${provider.color} rounded-t`}
                    style={{ height: `${provider.score}%` }}
                  ></div>
                  <span className="text-xs font-bold text-gray-700">{provider.score}</span>
                </div>
                <span className="text-xs text-gray-600 text-center">{provider.name}</span>
              </div>
            ))}
          </div>
          
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
            <span>100</span>
            <span>75</span>
            <span>50</span>
            <span>25</span>
            <span>0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
