export default function HowItWorksSection() {
  const steps = [
    {
      number: "1",
      title: "Enter Your Query",
      description: "Input your search query and target brand or product you want to analyze",
    },
    {
      number: "2", 
      title: "AI Analysis",
      description: "Our system queries 4 different AI providers simultaneously for comprehensive results",
    },
    {
      number: "3",
      title: "Get Insights", 
      description: "Receive detailed rankings, comparisons, and actionable insights across all providers",
    },
  ];

  return (
    <section className="py-16 px-6">
      <div className="max-w-[1280px] mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-geo-slate-900 mb-4">
            How GeoSight Works
          </h2>
          <p className="text-base text-geo-slate-600 max-w-[587px] mx-auto">
            Simple three-step process to get comprehensive AI-powered market insights
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              {/* Step Number */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-geo-blue-500 to-geo-blue-800 flex items-center justify-center mx-auto mb-6">
                <span className="text-xl font-bold text-white">{step.number}</span>
              </div>

              {/* Content */}
              <h3 className="text-base font-bold text-geo-slate-900 mb-3">
                {step.title}
              </h3>
              <p className="text-base text-geo-slate-600 max-w-[336px] mx-auto leading-6">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
