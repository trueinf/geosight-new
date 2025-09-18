import { MessageSquare, Sparkles, Search, Gem } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { type ProviderKey, type ParsedResultItem } from "@/lib/api";

interface ProviderTabsProps {
  providerItems: Record<ProviderKey, ParsedResultItem[]>;
  target: string;
}

export default function ProviderTabs({ providerItems, target }: ProviderTabsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const activeId = params.get('provider') || 'claude';

  const onSelect = (id: string) => {
    params.set('provider', id);
    navigate(`${location.pathname}?${params.toString()}`);
  };

  // Calculate real rankings from data
  const getRanking = (providerKey: ProviderKey) => {
    const items = providerItems[providerKey] || [];
    const targetRank = items.findIndex(item => 
      item.title.toLowerCase().includes(target.toLowerCase())
    );
    return targetRank >= 0 ? targetRank + 1 : null;
  };

  const providers = [
    {
      id: 'claude',
      name: 'Claude',
      icon: MessageSquare,
      bgColor: 'bg-green-500',
      borderColor: 'border-b-green-500',
      textColor: 'text-green-600',
    },
    {
      id: 'openai',
      name: 'Chat GPT',
      icon: Sparkles,
      bgColor: 'bg-purple-500',
      borderColor: 'border-b-purple-500',
      textColor: 'text-purple-600',
    },
    {
      id: 'perplexity',
      name: 'Perplexity',
      icon: Search,
      bgColor: 'bg-blue-500',
      borderColor: 'border-b-blue-500',
      textColor: 'text-blue-600',
    },
    {
      id: 'gemini',
      name: 'Gemini',
      icon: Gem,
      bgColor: 'bg-orange-500',
      borderColor: 'border-b-orange-500',
      textColor: 'text-orange-600',
    }
  ];

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="flex items-center gap-8 px-6">
        {providers.map((provider) => {
          const Icon = provider.icon;
          const ranking = getRanking(provider.id as ProviderKey);
          const isActive = activeId === provider.id;
          
          return (
            <button
              key={provider.id}
              onClick={() => onSelect(provider.id)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 ${
                isActive ? provider.borderColor : 'border-b-transparent'
              } ${
                isActive
                  ? provider.textColor + ' font-bold'
                  : 'text-geo-slate-600 hover:text-geo-slate-900 font-bold'
              } transition-colors`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-base">{provider.name}</span>
              <div className={`${provider.bgColor} text-white text-xs font-bold px-2 py-1 rounded`}>
                {ranking ? `#${ranking}` : '--'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
