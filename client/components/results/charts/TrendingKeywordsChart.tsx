import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface TrendingKeyword {
  keyword: string;
  growth_pct: number;
}

interface TrendingKeywordsChartProps {
  data?: TrendingKeyword[];
}

// Mock data for demonstration
const mockData: TrendingKeyword[] = [
  { keyword: "nike pegasus", growth_pct: 35 },
  { keyword: "adidas ultraboost", growth_pct: 22 },
  { keyword: "brooks ghost", growth_pct: 18 },
  { keyword: "asics gel", growth_pct: 15 },
  { keyword: "new balance", growth_pct: 12 },
  { keyword: "hoka one one", growth_pct: 10 },
  { keyword: "saucony triumph", growth_pct: 8 },
  { keyword: "mizuno wave", growth_pct: 6 }
];

export default function TrendingKeywordsChart({ data = mockData }: TrendingKeywordsChartProps) {
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">
            Keyword: <span className="text-blue-600">{label}</span>
          </p>
          <p className="text-sm text-gray-600">
            Growth: <span className="text-green-600 font-semibold">{payload[0].value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label formatter for Y-axis
  const formatKeyword = (value: string) => {
    return value.length > 15 ? value.substring(0, 15) + '...' : value;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-[18px] h-[18px] text-geo-blue-500" />
        <h3 className="text-lg font-bold text-geo-slate-900">Trending Keywords Growth</h3>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              type="number" 
              domain={[0, 'dataMax']}
              tickFormatter={(value) => `${value}%`}
              stroke="#64748b"
              fontSize={12}
            />
            <YAxis 
              type="category" 
              dataKey="keyword"
              tickFormatter={formatKeyword}
              stroke="#64748b"
              fontSize={12}
              width={75}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="growth_pct" 
              fill="#3b82f6"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
