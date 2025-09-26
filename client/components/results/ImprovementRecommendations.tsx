import { Rocket, Plus, Megaphone, Check, Star } from "lucide-react";

const seoRecommendations = [
  'Create content targeting "Nike Pegasus flat feet support"',
  "Develop comparison guides vs stability shoes",
  "Partner with running blogs for reviews",
  'Optimize for "neutral shoes for flat feet"'
];

const brandRecommendations = [
  "Highlight versatility for different foot types",
  "Collaborate with podiatrists for endorsements",
  "Create flat feet specific colorways/editions",
  "Develop insole partnership recommendations"
];

export default function ImprovementRecommendations() {
  return (
    <div 
      className="rounded-xl border-2 border-amber-200 p-6"
      style={{
        background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.10) 0%, #FFEDD5 100%)'
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <Rocket className="w-[18px] h-[18px] text-amber-500" />
        <h3 className="text-lg font-bold text-geo-slate-900">How to Improve Nike Pegasus Ranking</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SEO Optimization */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Plus className="w-4 h-4 text-geo-blue-500" />
            <h4 className="text-base font-semibold text-geo-slate-700">SEO Optimization</h4>
          </div>
          
          <ul className="space-y-2">
            {seoRecommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="w-3 h-3 text-green-500 mt-1.5 flex-shrink-0" />
                <span className="text-sm text-black">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Brand Strategy */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Megaphone className="w-4 h-4 text-amber-500" />
            <h4 className="text-base font-semibold text-geo-slate-700">Brand Strategy</h4>
          </div>
          
          <ul className="space-y-2">
            {brandRecommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-3">
                <Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-black">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
