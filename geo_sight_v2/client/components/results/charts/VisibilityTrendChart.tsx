import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface VisibilityTrendData {
  week: string;
  avg_position: number;
}

interface VisibilityTrendChartProps {
  data?: VisibilityTrendData[];
}

// Mock data for demonstration
const mockData: VisibilityTrendData[] = [
  { week: "2024-01-01", avg_position: 6.2 },
  { week: "2024-01-08", avg_position: 5.8 },
  { week: "2024-01-15", avg_position: 5.1 },
  { week: "2024-01-22", avg_position: 4.7 },
  { week: "2024-01-29", avg_position: 4.2 },
  { week: "2024-02-05", avg_position: 3.8 },
  { week: "2024-02-12", avg_position: 3.3 },
  { week: "2024-02-19", avg_position: 3.1 },
  { week: "2024-02-26", avg_position: 2.9 },
  { week: "2024-03-05", avg_position: 2.7 },
  { week: "2024-03-12", avg_position: 2.4 },
  { week: "2024-03-19", avg_position: 2.1 }
];

export default function VisibilityTrendChart({ data = mockData }: VisibilityTrendChartProps) {
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">
            Week: <span className="text-blue-600">{formattedDate}</span>
          </p>
          <p className="text-sm text-gray-600">
            Avg Position: <span className="text-green-600 font-semibold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Format week labels for X-axis
  const formatWeekLabel = (week: string) => {
    const date = new Date(week);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-[18px] h-[18px] text-geo-blue-500" />
        <h3 className="text-lg font-bold text-geo-slate-900">Visibility Trend Over Time</h3>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="week"
              tickFormatter={formatWeekLabel}
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
            <Line 
              type="monotone" 
              dataKey="avg_position" 
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
