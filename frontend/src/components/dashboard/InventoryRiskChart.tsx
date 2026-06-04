import { Pie, PieChart, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

interface RiskSegment {
  name: 'Low' | 'Medium' | 'High';
  value: number;
  color: string;
}

const data: RiskSegment[] = [
  { name: 'Low', value: 130, color: '#22C55E' },
  { name: 'Medium', value: 85, color: '#F59E0B' },
  { name: 'High', value: 33, color: '#EF4444' },
];

export function InventoryRiskChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
    >
      <h2 className="mb-5 text-lg font-semibold text-slate-950">Inventory Risk Overview</h2>
      <div className="relative h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={2}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-x-0 top-1/2 mx-auto w-full -translate-y-1/2 text-center">
          <p className="text-lg font-semibold text-slate-950">248</p>
          <p className="text-sm text-gray-500">Items</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        {data.map((segment) => (
          <div key={segment.name} className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
            <span className="text-sm font-medium text-slate-900">{segment.name}</span>
            <span className="ml-auto text-sm text-gray-500">{segment.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
