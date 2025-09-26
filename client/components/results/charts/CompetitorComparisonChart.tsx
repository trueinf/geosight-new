import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart as BarChartIcon } from 'lucide-react';

interface CompetitorData {
  provider: string;
  target: number;
  competitor: number;
}

interface CompetitorComparisonChartProps {
  data?: CompetitorData[];
}

// Mock data for demonstration
const mockData: CompetitorData[] = [
  { provider: "ChatGPT", target: 3, competitor: 2 },
  { provider: "Claude", target: 2, competitor: 3 },
  { provider: "Perplexity", target: 5, competitor: 4 },
  { provider: "Gemini", target: 2, competitor: 3 }
];

export default function CompetitorComparisonChart({ data = mockData }: CompetitorComparisonChartProps) {
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const targetData = payload.find((p: any) => p.dataKey === 'target');
      const competitorData = payload.find((p: any) => p.dataKey === 'competitor');
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">
            Provider: <span className="text-blue-600">{label}</span>
          </p>
          {targetData && (
            <p className="text-sm text-gray-600">
              Target Position: <span className="text-green-600 font-semibold">{targetData.value}</span>
            </p>
          )}
          {competitorData && (
            <p className="text-sm text-gray-600">
              Competitor Position: <span className="text-orange-600 font-semibold">{competitorData.value}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChartIcon className="w-[18px] h-[18px] text-geo-blue-500" />
        <h3 className="text-lg font-bold text-geo-slate-900">Target vs Competitor Positions</h3>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
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
            <Legend 
              verticalAlign="top" 
              height={36}
              iconType="rect"
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Bar 
              dataKey="target" 
              name="Target"
              fill="#10b981"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="competitor" 
              name="Competitor"
              fill="#f59e0b"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
