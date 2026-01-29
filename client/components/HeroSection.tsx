import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FormEvent, useRef, useState } from "react";

export default function HeroSection() {
  const navigate = useNavigate();
  const keywordsRef = useRef<HTMLTextAreaElement | null>(null);
  const [keywordsError, setKeywordsError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const keywords = keywordsRef.current?.value?.trim() || "";
    
    if (!keywords) {
      setKeywordsError("Please enter at least one keyword or phrase");
      keywordsRef.current?.focus();
      return;
    }
    
    const keywordList = keywords.split('\n').filter(k => k.trim().length > 0);
    
    if (keywordList.length === 0) {
      setKeywordsError("Please enter at least one keyword or phrase");
      keywordsRef.current?.focus();
      return;
    }
    
    if (keywordList.length > 25) {
      setKeywordsError("Maximum 25 keywords/phrases allowed");
      keywordsRef.current?.focus();
      return;
    }
    
    setKeywordsError("");
    
    const params = new URLSearchParams();
    params.set('keywords', keywordList.join(','));
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
                Enter up to 25 keywords or phrases (one per line) to analyze search results
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Keywords/Phrases Input */}
              <div className="space-y-2">
                <Label htmlFor="keywords" className="text-sm font-semibold text-geo-slate-700">
                  Keywords / Phrases (up to 25, one per line)
                </Label>
                <div className="relative">
                  <Textarea
                    id="keywords"
                    placeholder="e.g., best running shoes for beginners&#10;running shoes for flat feet&#10;affordable running shoes"
                    className={`min-h-[200px] text-base rounded-xl border-slate-200 bg-geo-slate-50 pr-12 resize-y ${keywordsError ? "border-red-500" : ""}`}
                    required
                    ref={keywordsRef}
                    onInput={() => setKeywordsError("")}
                  />
                  <Search className="absolute right-4 top-4 w-4 h-4 text-geo-slate-400" />
                </div>
                {keywordsError && (
                  <p className="text-sm text-red-600 mt-1">{keywordsError}</p>
                )}
                <p className="text-xs text-geo-slate-500 mt-1">
                  Enter one keyword or phrase per line. Maximum 25 keywords/phrases.
                </p>
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
