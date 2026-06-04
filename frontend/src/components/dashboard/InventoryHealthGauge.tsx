import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface Props {
  value: number;
  className?: string;
}

export function InventoryHealthGauge({ value = 75, className }: Props) {
  const segments = [{ name: 'health', value: Math.max(0, Math.min(100, value)), fill: value >= 85 ? '#10B981' : value >= 65 ? '#F59E0B' : '#EF4444' }];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className={`rounded-2xl bg-white p-5 shadow-sm border border-gray-100 ${className ?? ''}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Inventory Health</h3>
        <p className="text-sm text-slate-500">Overall Score</p>
      </div>

      <div className="mt-4 flex items-center justify-center">
        <div className="h-48 w-48">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart innerRadius="70%" outerRadius="100%" data={segments} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" cornerRadius={8} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-4 text-center">
        <p className="text-3xl font-semibold text-slate-900">{segments[0].value}%</p>
        <p className="text-sm text-slate-500">{segments[0].value >= 85 ? 'Excellent' : segments[0].value >= 65 ? 'Good' : 'Poor'}</p>
      </div>
    </motion.div>
  );
}
