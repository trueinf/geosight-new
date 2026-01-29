import { useNavigate, useLocation } from "react-router-dom";

interface KeywordTabsProps {
  keywords: string[];
  selectedKeyword: string;
}

export default function KeywordTabs({ keywords, selectedKeyword }: KeywordTabsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const handleKeywordSelect = (keyword: string) => {
    params.set('selectedKeyword', keyword);
    navigate(`${location.pathname}?${params.toString()}`);
  };

  if (keywords.length <= 1) {
    return null;
  }

  return (
    <div className="bg-white border-b border-slate-200 mb-6">
      <div className="px-6 py-3">
        <div className="text-sm font-semibold text-geo-slate-600 mb-3">
          Select Keyword ({keywords.length} total)
        </div>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, idx) => {
            const isActive = keyword === selectedKeyword;
            return (
              <button
                key={idx}
                onClick={() => handleKeywordSelect(keyword)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {keyword.length > 30 ? `${keyword.substring(0, 30)}...` : keyword}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
