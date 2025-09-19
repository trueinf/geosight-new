import { Flame, TrendingUp, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const trendingKeywords = [
  { text: "flat feet support", color: "bg-green-100 text-green-700" },
  { text: "motion control", color: "bg-blue-100 text-blue-700" },
  { text: "stability running", color: "bg-purple-100 text-purple-700" },
  { text: "arch support", color: "bg-orange-100 text-orange-700" },
  { text: "overpronation", color: "bg-red-100 text-red-700" }
];

const searchVolumeTrends = [
  { keyword: "Best running shoes", change: "+15%", color: "text-green-600" },
  { keyword: "Flat feet shoes", change: "+8%", color: "text-blue-600" },
  { keyword: "Nike Pegasus", change: "+12%", color: "text-purple-600" }
];

const marketInsights = [
  { text: "Stability shoes gaining 18% more mentions", icon: TrendingUp, color: "text-green-500" },
  { text: "Nike Pegasus maintains strong brand recall", icon: Star, color: "text-yellow-500" },
  { text: "Brooks gaining ground in stability segment", icon: TrendingUp, color: "text-blue-500" }
];

export default function CurrentTrends() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <Flame className="w-4 h-4 text-amber-500" />
        <h3 className="text-lg font-bold text-geo-slate-900">Current Trends & Insights</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trending Keywords */}
        <div>
          <h4 className="text-base font-semibold text-geo-slate-700 mb-3">Trending Keywords</h4>
          <div className="flex flex-wrap gap-2">
            {trendingKeywords.map((keyword, index) => (
              <Badge key={index} className={`${keyword.color} border-0 text-sm`}>
                {keyword.text}
              </Badge>
            ))}
          </div>
        </div>

        {/* Search Volume Trends */}
        <div>
          <h4 className="text-base font-semibold text-geo-slate-700 mb-3">Search Volume Trends</h4>
          <div className="space-y-2">
            {searchVolumeTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-geo-slate-600">{trend.keyword}</span>
                <span className={`text-sm font-semibold ${trend.color}`}>{trend.change}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Market Insights */}
        <div>
          <h4 className="text-base font-semibold text-geo-slate-700 mb-3">Market Insights</h4>
          <div className="space-y-3">
            {marketInsights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <div key={index} className="flex items-start gap-2">
                  <Icon className={`w-4 h-4 mt-0.5 ${insight.color}`} />
                  <span className="text-sm text-geo-slate-600">{insight.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
