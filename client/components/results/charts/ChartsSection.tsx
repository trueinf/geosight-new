import TrendingKeywordsChart from './TrendingKeywordsChart';
import VisibilityTrendChart from './VisibilityTrendChart';
import ProviderComparisonChart from './ProviderComparisonChart';
import CompetitorComparisonChart from './CompetitorComparisonChart';

interface ChartsSectionProps {
  // Add any props you might need for data integration
  className?: string;
}

export default function ChartsSection({ className = '' }: ChartsSectionProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* First row - Two charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendingKeywordsChart />
        <VisibilityTrendChart />
      </div>
      
      {/* Second row - Two charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProviderComparisonChart />
        <CompetitorComparisonChart />
      </div>
    </div>
  );
}
