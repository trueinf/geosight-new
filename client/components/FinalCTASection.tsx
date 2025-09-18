import { Button } from "@/components/ui/button";
import { Rocket, Play } from "lucide-react";

export default function FinalCTASection() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center max-w-[768px] mx-auto">
          <h2 className="text-4xl font-bold text-geo-slate-900 mb-6 leading-[40px]">
            Ready to Analyze Your Market Position?
          </h2>
          <p className="text-xl text-geo-slate-600 mb-12 leading-7">
            Start your comprehensive AI-powered market research today
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button 
              className="h-14 px-8 text-base font-semibold rounded-xl btn-gradient-blue hover:opacity-90 transition-opacity"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Start Free Analysis
            </Button>
            <Button 
              variant="outline"
              className="h-15 px-8 text-base font-semibold rounded-xl border-2 border-geo-blue-500 text-geo-blue-500 hover:bg-geo-blue-50"
            >
              <Play className="w-3 h-4 mr-2" />
              Watch Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
