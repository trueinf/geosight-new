import { Lightbulb, Target, Check, ArrowRight } from "lucide-react";
import { type ProviderKey, type ParsedResultItem } from "@/lib/api";

interface AnalysisSummaryProps {
  providerItems: Record<ProviderKey, ParsedResultItem[]>;
  target: string;
  query: string;
}

interface TargetAnalysis {
  headline: string;
  average_position: number | null;
  visibility_score: number;
  providers_missing_in: string[];
  target_gaps: string[];
  performance_drivers: string[];
  next_steps: Array<{ action: string; why: string; priority: 'quick_win' | 'strategic' }>;
  sentiment_overall: 'positive' | 'neutral' | 'negative';
  confidence: number;
  citations: string[];
}

export default function AnalysisSummary({ providerItems, target, query }: AnalysisSummaryProps) {

  // Generate target aliases using LLM-like logic (no separate API call)
  const generateTargetAliases = (target: string): string[] => {
    const aliases = [target.toLowerCase()];
    
    // Common variations
    const words = target.toLowerCase().split(' ');
    
    // Add partial matches
    if (words.length > 1) {
      aliases.push(words[words.length - 1]); // Last word (e.g., "Pegasus" from "Nike Air Zoom Pegasus")
      aliases.push(words.slice(-2).join(' ')); // Last two words
    }
    
    // Add brand-specific variations
    if (target.toLowerCase().includes('nike')) {
      aliases.push(target.replace(/nike\s*/i, '').trim());
    }
    if (target.toLowerCase().includes('apple')) {
      aliases.push(target.replace(/apple\s*/i, '').trim());
    }
    
    // Remove empty strings and duplicates
    return [...new Set(aliases.filter(alias => alias.length > 0))];
  };

  // Enhanced matching with aliases
  const findTargetInResults = (items: ParsedResultItem[], target: string) => {
    const aliases = generateTargetAliases(target);
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const titleLower = item.title.toLowerCase();
      
      // Check if any alias matches
      if (aliases.some(alias => titleLower.includes(alias))) {
        return { item, index: i, rank: i + 1 };
      }
    }
    return null;
  };

  // Generate target-centric analysis following the prompt exactly
  const generateTargetAnalysis = (): TargetAnalysis => {
    const providers = [
      { key: 'claude' as ProviderKey, name: 'Claude' },
      { key: 'openai' as ProviderKey, name: 'ChatGPT' },
      { key: 'perplexity' as ProviderKey, name: 'Perplexity' },
      { key: 'gemini' as ProviderKey, name: 'Gemini' }
    ];

    const targetResults: Array<{ provider: string, rank: number, item: ParsedResultItem }> = [];
    const providersWithTarget: string[] = [];
    const providersMissingTarget: string[] = [];
    const allCitations: string[] = [];

    // Analyze each provider for target presence
    providers.forEach(provider => {
      const items = providerItems[provider.key] || [];
      const found = findTargetInResults(items, target);
      
      if (found) {
        targetResults.push({
          provider: provider.name,
          rank: found.rank,
          item: found.item
        });
        providersWithTarget.push(provider.name);
        
        // Collect citations
        if (found.item.citations) {
          allCitations.push(...found.item.citations);
        }
      } else {
        providersMissingTarget.push(provider.name);
      }
    });

    // Calculate average position (only from providers where target appears)
    const averagePosition = targetResults.length > 0 
      ? targetResults.reduce((sum, result) => sum + result.rank, 0) / targetResults.length 
      : null;

    // Calculate visibility score
    const visibilityScore = targetResults.length / providers.length;

    // Generate target gaps (why target is missing)
    const targetGaps: string[] = [];
    if (providersMissingTarget.length > 0) {
      targetGaps.push(`${target} missing from ${providersMissingTarget.join(', ')}`);
      if (providersMissingTarget.length >= 3) {
        targetGaps.push(`${target} needs stronger SEO optimization`);
      }
    }

    // Add performance-based gaps even when target is found
    if (targetResults.length > 0) {
      const avgRank = targetResults.reduce((sum, result) => sum + result.rank, 0) / targetResults.length;
      
      if (avgRank > 3) {
        targetGaps.push(`${target} averages #${avgRank.toFixed(1)} - needs top-3 positioning`);
      }
      
      // Check for ranking inconsistency
      const ranks = targetResults.map(r => r.rank);
      const rankVariance = Math.max(...ranks) - Math.min(...ranks);
      if (rankVariance > 3) {
        targetGaps.push(`${target} has inconsistent rankings (${rankVariance}-position variance)`);
      }

      // Check for poor positions on specific providers
      const poorPerformers = targetResults.filter(r => r.rank > 4);
      if (poorPerformers.length > 0) {
        targetGaps.push(`${target} underperforms on ${poorPerformers.map(p => p.provider).join(', ')}`);
      }
    }

    // Generate performance drivers from target's "why" fields and context
    const performanceDrivers: string[] = [];
    targetResults.forEach(result => {
      if (result.item.why) {
        performanceDrivers.push(`${target} ranks #${result.rank} on ${result.provider}: ${result.item.why}`);
      }
      if (result.item.keywords && result.item.keywords.length > 0) {
        performanceDrivers.push(`${target} benefits from strong keyword relevance: ${result.item.keywords.join(', ')}`);
      }
    });

    // Fallback: Generate insights from available data if no specific "why" fields
    if (performanceDrivers.length === 0 && targetResults.length > 0) {
      // Analyze ranking patterns
      const topRankings = targetResults.filter(r => r.rank <= 3);
      if (topRankings.length > 0) {
        performanceDrivers.push(`${target} holds ${topRankings.length} top-3 position${topRankings.length > 1 ? 's' : ''}`);
      }

      // Analyze consistency
      const ranks = targetResults.map(r => r.rank);
      const rankVariance = Math.max(...ranks) - Math.min(...ranks);
      if (rankVariance <= 2) {
        performanceDrivers.push(`${target} shows consistent rankings (${rankVariance}-position variance)`);
      }

      // Provider-specific insights
      const topPerformers = targetResults.filter(r => r.rank === 1);
      if (topPerformers.length > 0) {
        performanceDrivers.push(`${target} leads on ${topPerformers.map(p => p.provider).join(', ')}`);
      }

      // Description and rating insights
      const ratedResults = targetResults.filter(r => r.item.rating);
      if (ratedResults.length > 0) {
        performanceDrivers.push(`${target} has strong ratings on ${ratedResults.length} provider${ratedResults.length > 1 ? 's' : ''}`);
      }

      const detailedResults = targetResults.filter(r => r.item.description && r.item.description.length > 100);
      if (detailedResults.length > 0) {
        performanceDrivers.push(`${target} benefits from detailed content on ${detailedResults.length} provider${detailedResults.length > 1 ? 's' : ''}`);
      }
    }

    // Generate next steps (actionable for target, prioritized)
    const nextSteps: Array<{ action: string; why: string; priority: 'quick_win' | 'strategic' }> = [];
    
    // Quick wins first
    if (providersMissingTarget.length > 0) {
      nextSteps.push({
        action: `Optimize ${target}'s content for ${providersMissingTarget.join(' and ')} algorithms`,
        why: `This will help ${target} appear in ${providersMissingTarget.length} additional provider${providersMissingTarget.length > 1 ? 's' : ''}`,
        priority: 'quick_win'
      });
    }

    if (averagePosition && averagePosition > 3) {
      nextSteps.push({
        action: `Improve ${target}'s ranking factors (authority, relevance, citations)`,
        why: `Current average position of #${averagePosition.toFixed(1)} can be improved to top 3`,
        priority: 'quick_win'
      });
    }

    // Strategic moves
    nextSteps.push({
      action: `Build comprehensive content hub specifically about ${target}`,
      why: `This will strengthen ${target}'s topical authority and improve rankings across all providers`,
      priority: 'strategic'
    });

    nextSteps.push({
      action: `Monitor ${target}'s competitor movements and ranking changes`,
      why: `This helps ${target} maintain competitive advantage and respond to market shifts`,
      priority: 'strategic'
    });

    // Determine sentiment (majority vote from providers)
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (visibilityScore >= 0.75) sentiment = 'positive';
    else if (visibilityScore <= 0.25) sentiment = 'negative';

    // Calculate confidence score
    const confidence = Math.min(1.0, 
      (targetResults.length * 0.25) + // Provider coverage
      (targetResults.length > 0 ? 0.3 : 0) + // Has any data
      (Math.max(0, (5 - (averagePosition || 5)) / 5) * 0.3) + // Position quality
      (targetResults.filter(r => r.item.why).length * 0.15) // Quality of explanations
    );

    // Generate headline
    let headline: string;
    if (targetResults.length === 0) {
      headline = `${target} is not visible in any AI provider results for "${query}" - immediate optimization needed.`;
    } else if (averagePosition && averagePosition <= 2) {
      headline = `${target} demonstrates strong market positioning with average rank #${averagePosition.toFixed(1)} across ${targetResults.length} AI providers.`;
    } else if (averagePosition && averagePosition <= 3) {
      headline = `${target} maintains solid visibility with room for improvement, averaging #${averagePosition.toFixed(1)} across ${targetResults.length} providers.`;
    } else {
      headline = `${target} shows limited visibility in AI search results, averaging #${averagePosition?.toFixed(1)} with optimization opportunities.`;
    }

    return {
      headline,
      average_position: averagePosition,
      visibility_score: visibilityScore,
      providers_missing_in: providersMissingTarget,
      target_gaps: targetGaps,
      performance_drivers: performanceDrivers,
      next_steps: nextSteps,
      sentiment_overall: sentiment,
      confidence,
      citations: [...new Set(allCitations)]
    };
  };

  const analysis = generateTargetAnalysis();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
      {/* Executive Headline */}
      <div className="mb-6">
        <p className="text-lg text-geo-slate-700 leading-relaxed border-l-4 border-blue-500 pl-4 bg-blue-50 p-4 rounded-r-lg">
          {analysis.headline}
        </p>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              analysis.sentiment_overall === 'positive' ? 'bg-green-500' :
              analysis.sentiment_overall === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-sm text-geo-slate-600 capitalize">{analysis.sentiment_overall} sentiment</span>
          </div>
          <div className="text-sm text-geo-slate-600">
            Confidence: {(analysis.confidence * 100).toFixed(0)}%
          </div>
          {analysis.average_position && (
            <div className="text-sm text-geo-slate-600">
              Avg Position: #{analysis.average_position.toFixed(1)}
            </div>
          )}
          <div className="text-sm text-geo-slate-600">
            Visibility: {(analysis.visibility_score * 100).toFixed(0)}%
          </div>
        </div>
      </div>
      
      {/* KPI Cards - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Performance Analysis Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h4 className="text-lg font-bold text-geo-slate-900">Performance Analysis</h4>
          </div>
          
          {/* Performance Drivers */}
          {analysis.performance_drivers.length > 0 && (
            <div className="mb-6">
              <h5 className="text-sm font-semibold text-green-700 mb-3">Strengths</h5>
              <ul className="space-y-3">
                {analysis.performance_drivers.map((driver, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-[14px] h-4 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-sm text-geo-slate-600 leading-5">{driver}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Target Gaps */}
          {analysis.target_gaps.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-semibold text-red-700 mb-3">Gaps to Address</h5>
              <ul className="space-y-3">
                {analysis.target_gaps.map((gap, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-[14px] h-4 bg-red-500 rounded-full mt-1 flex-shrink-0 flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </div>
                    <span className="text-sm text-geo-slate-600 leading-5">{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Providers */}
          {analysis.providers_missing_in.length > 0 && (
            <div className="p-3 bg-red-50 rounded-lg">
              <h5 className="text-sm font-semibold text-red-700 mb-2">Missing from Providers</h5>
              <div className="flex flex-wrap gap-2">
                {analysis.providers_missing_in.map((provider, index) => (
                  <span key={index} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                    {provider}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Plan Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-4 h-4 text-geo-blue-500" />
            <h4 className="text-lg font-bold text-geo-slate-900">Action Plan</h4>
          </div>
          
          {/* Quick Wins */}
          <div className="mb-6">
            <h5 className="text-sm font-semibold text-orange-700 mb-3 flex items-center gap-2">
              <span className="w-4 h-4 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-xs">⚡</span>
              Quick Wins
            </h5>
            <ul className="space-y-3">
              {analysis.next_steps
                .filter(step => step.priority === 'quick_win')
                .map((step, index) => (
                  <li key={index} className="space-y-1">
                    <div className="flex items-start gap-3">
                      <ArrowRight className="w-[14px] h-4 text-orange-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-geo-slate-900 leading-5 font-medium">{step.action}</span>
                    </div>
                    <p className="text-xs text-geo-slate-600 ml-6 italic">{step.why}</p>
                  </li>
                ))}
            </ul>
          </div>
          
          {/* Strategic Actions */}
          <div>
            <h5 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
              <span className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs">📈</span>
              Strategic Actions
            </h5>
            <ul className="space-y-3">
              {analysis.next_steps
                .filter(step => step.priority === 'strategic')
                .map((step, index) => (
                  <li key={index} className="space-y-1">
                    <div className="flex items-start gap-3">
                      <ArrowRight className="w-[14px] h-4 text-blue-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-geo-slate-900 leading-5 font-medium">{step.action}</span>
                    </div>
                    <p className="text-xs text-geo-slate-600 ml-6 italic">{step.why}</p>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Citations */}
      {analysis.citations.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-200">
          <h5 className="text-sm font-semibold text-geo-slate-700 mb-3">Key Sources</h5>
          <div className="flex flex-wrap gap-2">
            {analysis.citations.map((citation, index) => (
              <span key={index} className="px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">
                {citation}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
