import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
// Removed HowItWorksSection per request
// Removed sections per request: Benefits, Sample Results, Final CTA

export default function Index() {
  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      
      {/* Main Content */}
      <main className="pt-[77px]">
        <HeroSection />
        <FeaturesSection />
        {/* HowItWorksSection removed */}
        {/* Sections removed to simplify dashboard */}
      </main>

      <Footer />
    </div>
  );
}
