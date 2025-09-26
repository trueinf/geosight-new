import { MessageSquare, Sparkles, Search, Gem } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "UX Pilot Analysis",
    description: "Leverage UX Pilot AI's powerful language model for comprehensive market insights",
    gradient: "from-geo-green-50 to-geo-green-100",
    iconBg: "from-geo-green-500 to-geo-emerald-500",
  },
  {
    icon: Sparkles,
    title: "UX Pilot Intelligence", 
    description: "UX Pilot AI's UX Pilot provides nuanced analysis and detailed reasoning",
    gradient: "from-geo-purple-50 to-purple-50",
    iconBg: "from-geo-purple-500 to-purple-600",
  },
  {
    icon: Search,
    title: "Perplexity Search",
    description: "Real-time web search capabilities for current market data",
    gradient: "from-geo-blue-50 to-cyan-50",
    iconBg: "from-geo-blue-500 to-geo-cyan-500",
  },
  {
    icon: Gem,
    title: "Gemini Insights",
    description: "Google's advanced AI model for comprehensive analysis",
    gradient: "from-orange-50 to-red-50",
    iconBg: "from-geo-orange-500 to-geo-red-500",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-[1280px] mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-geo-slate-900 mb-4">
            Comprehensive AI Analysis
          </h2>
          <p className="text-base text-geo-slate-600 max-w-[628px] mx-auto">
            Get detailed insights from multiple AI providers to understand your market position
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl border border-slate-200 p-6 feature-shadow hover:shadow-lg transition-shadow"
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.iconBg} flex items-center justify-center mb-6`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-base font-bold text-geo-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-geo-slate-600 leading-5">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
