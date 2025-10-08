import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Target, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FormEvent, useRef } from "react";

export default function HeroSection() {
  const navigate = useNavigate();
  const queryRef = useRef<HTMLInputElement | null>(null);
  const targetRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = queryRef.current?.value?.trim() || "";
    const t = targetRef.current?.value?.trim() || "";
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (t) params.set('target', t);
    params.set('provider', 'claude');
    navigate(`/results?${params.toString()}`);
  };

  return (
    <section className="relative py-12 px-6">
      <div className="max-w-[1280px] mx-auto">
        {/* Hero Content */}
        <div className="text-center mb-16 px-42">
          <h1 className="text-5xl font-bold text-geo-slate-900 mb-6 max-w-[787px] mx-auto leading-[48px]">
            Multi-LLM Intelligence for{" "}
            <span className="text-geo-slate-900">Market Research</span>
          </h1>
          <p className="text-xl text-geo-slate-600 mb-8 max-w-[892px] mx-auto leading-[33px]">
            Compare and analyze how different AI providers rank your products, brands, or competitors 
            across multiple search queries. Get comprehensive insights from UX Pilot, UX Pilot, Perplexity, and Gemini.
          </p>
          
          {/* Feature badges */}
          <div className="flex justify-center items-center gap-6 mb-16">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-geo-green-500"></div>
              <span className="text-sm text-geo-slate-500">4 AI Providers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-geo-blue-500"></div>
              <span className="text-sm text-geo-slate-500">Real-time Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-geo-purple-500"></div>
              <span className="text-sm text-geo-slate-500">Comprehensive Reports</span>
            </div>
          </div>
        </div>

        {/* Analysis Form */}
        <div className="max-w-[896px] mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 card-shadow">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-geo-slate-900 mb-2">Start Your Analysis</h2>
              <p className="text-base text-geo-slate-600">
                Enter your search query and a distinct target brand/product to compare results
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Search Query */}
              <div className="space-y-2">
                <Label htmlFor="query" className="text-sm font-semibold text-geo-slate-700">
                  Search Query
                </Label>
                <div className="relative">
                  <Input
                    id="query"
                    placeholder="e.g., best running shoes for flat feet"
                    className="h-[62px] text-lg rounded-xl border-slate-200 bg-geo-slate-50 pr-12"
                    required
                    ref={queryRef}
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-geo-slate-400" />
                </div>
                {/* Query Suggestions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    "best wireless earbuds 2024",
                    "top smartphones under $800", 
                    "premium coffee machines",
                    "best gaming laptops",
                    "running shoes for beginners"
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        if (queryRef.current) {
                          queryRef.current.value = suggestion;
                        }
                      }}
                      className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all"
                    >
                      #{suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Brand/Product */}
              <div className="space-y-2">
                <Label htmlFor="target" className="text-sm font-semibold text-geo-slate-700">
                  Target Brand/Product
                </Label>
                <div className="relative">
                  <Input
                    id="target"
                    placeholder="e.g., Nike Air Zoom Pegasus"
                    className="h-[62px] text-lg rounded-xl border-slate-200 bg-geo-slate-50 pr-12"
                    required
                    ref={targetRef}
                  />
                  <Target className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-geo-slate-400" />
                </div>
                {/* Target Suggestions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    "Apple AirPods Pro",
                    "iPhone 15",
                    "Nike Air Zoom Pegasus",
                    "Breville Barista Express",
                    "ASUS ROG Strix",
                    "Samsung Galaxy S24",
                    "MacBook Pro M3"
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        if (targetRef.current) {
                          targetRef.current.value = suggestion;
                        }
                      }}
                      className="px-3 py-1 text-xs bg-orange-50 text-orange-700 rounded-full border border-orange-200 hover:bg-orange-100 hover:border-orange-300 transition-all"
                    >
                      #{suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                className="w-full h-[60px] text-lg font-semibold rounded-xl btn-gradient-blue hover:opacity-90 transition-opacity"
                type="submit"
              >
                <Rocket className="w-[18px] h-[18px] mr-2" />
                Start Analysis
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
