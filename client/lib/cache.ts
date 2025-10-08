import { type ProviderKey, type ParsedResultItem, type ImprovementRecommendation } from "@/lib/api";

// Shared cache instance across all pages
export const resultsCache = new Map<string, {
  data: Record<ProviderKey, ParsedResultItem[]>;
  improvementRecommendations: Record<ProviderKey, ImprovementRecommendation[] | undefined>;
  keywordPositions: Record<ProviderKey, number | undefined>;
  timestamp: number;
  query: string;
  target: string;
}>();

// Clear cache on page refresh
if (typeof window !== 'undefined') {
  const navigation = (performance as any).getEntriesByType?.('navigation')?.[0];
  if (navigation && navigation.type === 'reload') {
    resultsCache.clear();
    console.log('🔄 Shared cache cleared due to page refresh');
  }
}
