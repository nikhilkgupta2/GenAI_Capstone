import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import React from 'react';

interface Props {
  data?: { name: string; value: number; color: string }[];
  className?: string;
}

export function InventoryOverviewChart({ data, className }: Props) {
  const fallback = [
    { name: 'In Stock', value: 720, color: '#10B981' },
    { name: 'Low Stock', value: 120, color: '#F59E0B' },
    { name: 'Out Of Stock', value: 40, color: '#EF4444' },
    { name: 'Reserved', value: 60, color: '#3B82F6' },
  ];

  const chartData = data && data.length >= 4 ? data : fallback;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl bg-white p-5 shadow-sm border border-gray-100 ${className ?? ''}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Inventory Overview</h3>
        <p className="text-sm text-slate-500">Distribution</p>
      </div>

      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={4}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {chartData.map((s) => (
          <div key={s.name} className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
            <div>
              <p className="text-sm font-medium text-slate-900">{s.name}</p>
              <p className="text-xs text-slate-500">{s.value} items</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
