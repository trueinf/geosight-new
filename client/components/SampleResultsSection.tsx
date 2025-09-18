import { Badge } from "@/components/ui/badge";

const results = [
  {
    provider: "UX Pilot",
    ranking: "#3",
    rankingColor: "bg-geo-green-500",
    description: "Ranked 3rd out of 10 recommendations",
    bgGradient: "from-geo-green-50 to-green-50",
    borderColor: "border-green-200",
  },
  {
    provider: "UX Pilot", 
    ranking: "#2",
    rankingColor: "bg-geo-purple-500",
    description: "Ranked 2nd out of 8 recommendations", 
    bgGradient: "from-geo-purple-50 to-purple-50",
    borderColor: "border-purple-200",
  },
  {
    provider: "Perplexity",
    ranking: "#5", 
    rankingColor: "bg-geo-blue-500",
    description: "Ranked 5th out of 12 recommendations",
    bgGradient: "from-geo-blue-50 to-cyan-50", 
    borderColor: "border-blue-200",
  },
  {
    provider: "Gemini",
    ranking: "#1",
    rankingColor: "bg-geo-orange-500", 
    description: "Ranked 1st out of 7 recommendations",
    bgGradient: "from-orange-50 to-red-50",
    borderColor: "border-orange-200",
  },
];

export default function SampleResultsSection() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-[1280px] mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-geo-slate-900 mb-4">
            Sample Analysis Results
          </h2>
          <p className="text-base text-geo-slate-600 max-w-[459px] mx-auto">
            See how GeoSight presents comprehensive AI analysis data
          </p>
        </div>

        {/* Results Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 card-shadow">
          {/* Query Info */}
          <div className="mb-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-geo-slate-900">
                Query: "best running shoes for flat feet"
              </h3>
              <Badge className="bg-geo-green-100 text-geo-green-700 border-0">
                Completed
              </Badge>
            </div>
            <p className="text-base text-geo-slate-600">
              Target: Nike Air Zoom Pegasus
            </p>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border bg-gradient-to-br ${result.bgGradient} ${result.borderColor}`}
              >
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-base font-semibold text-geo-slate-900">
                    {result.provider}
                  </h4>
                  <div className={`px-2 py-1 rounded text-white text-sm font-bold ${result.rankingColor}`}>
                    {result.ranking}
                  </div>
                </div>
                <p className="text-sm text-geo-slate-600 leading-5">
                  {result.description}
                </p>
              </div>
            ))}
          </div>

          {/* Average Position */}
          <div className="bg-geo-slate-50 rounded-xl p-6">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-base font-bold text-geo-slate-900 mb-1">
                  Average Position
                </h4>
                <p className="text-sm text-geo-slate-600">
                  Across all AI providers
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-geo-blue-500">#2.75</div>
                <p className="text-sm text-geo-slate-600">Strong performance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
