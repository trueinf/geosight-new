import { TrendingUp, Zap, Target } from "lucide-react";

const benefits = [
  {
    icon: TrendingUp,
    title: "Multi-Provider Analysis",
    description: "Compare results across 4 different AI providers for comprehensive insights",
  },
  {
    icon: Zap,
    title: "Real-Time Results", 
    description: "Get instant analysis and rankings updated in real-time",
  },
  {
    icon: Target,
    title: "Competitive Intelligence",
    description: "Track your position against competitors across different AI platforms",
  },
];

export default function BenefitsSection() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-[1280px] mx-auto">
        <div className="bg-gradient-to-r from-geo-blue-500 to-geo-blue-800 rounded-2xl p-8">
          <div className="max-w-[896px] mx-auto">
            {/* Section Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                Why Choose GeoSight?
              </h2>
              <p className="text-base text-geo-blue-100 max-w-[479px] mx-auto">
                Comprehensive AI-powered market research at your fingertips
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
                  >
                    {/* Icon */}
                    <Icon className="w-6 h-6 text-white mb-4" />

                    {/* Content */}
                    <h3 className="text-base font-bold text-white mb-3">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-geo-blue-100 leading-5">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
