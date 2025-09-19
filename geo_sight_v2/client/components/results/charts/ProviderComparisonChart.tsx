import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart as BarChartIcon } from 'lucide-react';

interface ProviderData {
  provider: string;
  position: number;
}

interface ProviderComparisonChartProps {
  data?: ProviderData[];
}

// Mock data for demonstration
const mockData: ProviderData[] = [
  { provider: "ChatGPT", position: 3 },
  { provider: "Claude", position: 2 },
  { provider: "Perplexity", position: 5 },
  { provider: "Gemini", position: 2 }
];

export default function ProviderComparisonChart({ data = mockData }: ProviderComparisonChartProps) {
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">
            Provider: <span className="text-blue-600">{label}</span>
          </p>
          <p className="text-sm text-gray-600">
            Position: <span className="text-green-600 font-semibold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Color mapping for different providers
  const getBarColor = (provider: string) => {
    const colors: Record<string, string> = {
      'ChatGPT': '#10b981', // Green
      'Claude': '#8b5cf6',  // Purple
      'Perplexity': '#3b82f6', // Blue
      'Gemini': '#f59e0b'   // Orange
    };
    return colors[provider] || '#6b7280'; // Default gray
  };

  // Add color to data for rendering
  const dataWithColors = data.map(item => ({
    ...item,
    color: getBarColor(item.provider)
  }));

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChartIcon className="w-[18px] h-[18px] text-geo-blue-500" />
        <h3 className="text-lg font-bold text-geo-slate-900">Provider Comparison: Target Position</h3>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dataWithColors}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="provider"
              stroke="#64748b"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              domain={[1, 10]}
              tickCount={6}
              stroke="#64748b"
              fontSize={12}
              reversed={true} // Invert Y-axis so lower position = higher on chart
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="position"
              fill="#8884d8"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
