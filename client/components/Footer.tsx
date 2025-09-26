import { Globe, Twitter, Linkedin, Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-geo-slate-900 text-white">
      <div className="max-w-[1280px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-geo-blue-500 to-geo-blue-800 flex items-center justify-center p-2">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold">GeoSight</span>
            </div>
            <p className="text-sm text-geo-slate-400 max-w-[283px]">
              Multi-LLM intelligence for comprehensive market research and competitive analysis.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-base font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-geo-slate-400 hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="text-sm text-geo-slate-400 hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="text-sm text-geo-slate-400 hover:text-white transition-colors">API</a></li>
              <li><a href="#" className="text-sm text-geo-slate-400 hover:text-white transition-colors">Documentation</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-base font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-geo-slate-400 hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="text-sm text-geo-slate-400 hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="text-sm text-geo-slate-400 hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="text-sm text-geo-slate-400 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-base font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-geo-slate-400 hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="text-sm text-geo-slate-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-geo-slate-400 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-sm text-geo-slate-400 hover:text-white transition-colors">Status</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-geo-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-geo-slate-400">© 2024 GeoSight. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-geo-slate-400 hover:text-white transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="text-geo-slate-400 hover:text-white transition-colors">
              <Linkedin className="w-4 h-4" />
            </a>
            <a href="#" className="text-geo-slate-400 hover:text-white transition-colors">
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
