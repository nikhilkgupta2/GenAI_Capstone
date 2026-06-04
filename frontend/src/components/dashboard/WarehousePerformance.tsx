import React from 'react';
import { motion } from 'framer-motion';

const data = [
  { name: 'Warehouse A', util: 82, speed: 78, turnover: 6.2 },
  { name: 'Warehouse B', util: 69, speed: 64, turnover: 4.8 },
  { name: 'Warehouse C', util: 54, speed: 58, turnover: 3.9 },
];

export function WarehousePerformance() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Warehouse Performance</h3>
        <div className="text-sm text-slate-500">Utilization / Speed / Turnover</div>
      </div>

      <div className="mt-4 space-y-3">
        {data.map((d) => (
          <div key={d.name} className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900">{d.name}</p>
              <p className="text-sm text-slate-500">Turnover: {d.turnover}x</p>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-100">
              <div className={`h-3 rounded-full`} style={{ width: `${d.util}%`, background: `linear-gradient(90deg,#4F46E5,#7C3AED)` }} />
            </div>
            <div className="text-xs text-slate-500">Processing speed: {d.speed}%</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
