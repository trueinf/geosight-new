import { Globe, BarChart3, Search, HelpCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";

export default function Header() {
  const location = useLocation();
  const isResultsPage = location.pathname === "/results";
  const isHomePage = location.pathname === "/";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full h-[77px] px-20 bg-white/90 backdrop-blur-sm border-b border-slate-200">
      <div className="flex items-center justify-between h-full max-w-[1280px] mx-auto px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-geo-blue-500 to-geo-blue-800 flex items-center justify-center p-2">
            <Globe className="w-[18px] h-[18px] text-white" />
          </div>
          <span className="text-2xl font-bold text-geo-slate-900 font-inter">GeoSight</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-8">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className={`flex items-center gap-2 pb-1 ${
                isHomePage
                  ? "text-geo-blue-500 border-b-2 border-geo-blue-500"
                  : "text-geo-slate-600 hover:text-geo-slate-900"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-base font-semibold">Start Analysis</span>
            </Link>

            <Link
              to="/results"
              className={`flex items-center gap-2 pb-1 ${
                isResultsPage
                  ? "text-geo-blue-500 border-b-2 border-geo-blue-500"
                  : "text-geo-slate-600 hover:text-geo-slate-900"
              }`}
            >
              <Search className="w-4 h-4" />
              <span className="text-base font-semibold">Results</span>
            </Link>

            <div className="flex items-center gap-2 text-geo-slate-600">
              <HelpCircle className="w-4 h-4" />
              <span className="text-base">Report</span>
            </div>
          </div>

          {/* User actions */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="w-8 h-11 text-geo-slate-600">
              <Bell className="w-4 h-4" />
            </Button>
            <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=user"
                alt="User avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
