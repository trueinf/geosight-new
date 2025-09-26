import { Lightbulb, Target, Check, ArrowRight } from "lucide-react";

const insights = [
  "Nike Pegasus shows strong performance across multiple AI providers",
  "ASICS Gel-Kayano 29 consistently ranks in top 3 for flat feet support", 
  "Brooks Adrenaline GTS 23 favored by UX Pilot and Perplexity for stability",
  "Average position of #2.75 indicates strong market presence"
];

const recommendations = [
  "Focus marketing on stability features for flat feet segment",
  "Consider partnerships with podiatrists and running specialists", 
  "Develop content addressing flat feet running concerns",
  "Monitor competitor positioning in stability running market"
];

export default function AnalysisSummary() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
      <h3 className="text-2xl font-bold text-geo-slate-900 mb-6">Analysis Summary</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Key Insights */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="w-3 h-4 text-amber-500" />
            <h4 className="text-base font-bold text-geo-slate-900">Key Insights</h4>
          </div>
          
          <ul className="space-y-3">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="w-[14px] h-4 text-green-500 mt-1 flex-shrink-0" />
                <span className="text-base text-geo-slate-600 leading-6">{insight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-4 h-4 text-geo-blue-500" />
            <h4 className="text-base font-bold text-geo-slate-900">Recommendations</h4>
          </div>
          
          <ul className="space-y-3">
            {recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-3">
                <ArrowRight className="w-[14px] h-4 text-geo-blue-500 mt-1 flex-shrink-0" />
                <span className="text-base text-geo-slate-600 leading-6">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
