import { Line, LineChart, ResponsiveContainer } from 'recharts';

interface DemandTrendItem {
  cat: string;
  change: number;
  data: number[];
}

const trends: DemandTrendItem[] = [
  { cat: 'Electronics', change: 8.5, data: [10, 14, 12, 18, 22, 20, 25] },
  { cat: 'Accessories', change: 2.1, data: [8, 9, 8, 10, 11, 10, 12] },
  { cat: 'Networking', change: -5.0, data: [15, 13, 12, 10, 9, 8, 7] },
  { cat: 'Peripherals', change: 3.2, data: [5, 6, 7, 6, 8, 9, 10] },
  { cat: 'Storage', change: -1.8, data: [12, 11, 10, 11, 9, 10, 8] },
];

export function DemandTrendsPanel() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-semibold text-slate-950">Demand Trends (30 Days)</h2>
        <button type="button" className="text-blue-500 text-sm font-semibold hover:text-blue-600">
          View Trend Analysis →
        </button>
      </div>
      <div className="space-y-4">
        {trends.map((item) => {
          const positive = item.change >= 0;
          return (
            <div key={item.cat} className="flex items-center justify-between gap-3">
              <span className="w-28 text-sm font-medium text-slate-900">{item.cat}</span>
              <div className="h-7 w-20">
                <ResponsiveContainer width="100%" height={28}>
                  <LineChart data={item.data.map((value) => ({ value }))}>
                    <Line type="monotone" dataKey="value" stroke={positive ? '#22C55E' : '#EF4444'} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <span className={positive ? 'text-emerald-600 text-xs font-semibold' : 'text-red-500 text-xs font-semibold'}>
                {positive ? `+${item.change}%` : `${item.change}%`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
