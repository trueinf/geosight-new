import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";

export default function Index() {
  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      
      {/* Main Content */}
      <main className="pt-[77px]">
        <HeroSection />
        <FeaturesSection />
      </main>

      <Footer />
    </div>
  );
}
