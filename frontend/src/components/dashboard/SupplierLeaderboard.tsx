import React from 'react';
import { motion } from 'framer-motion';

const suppliers = [
  { name: 'Supplier A', reliability: 'A', onTime: 98, rating: 4.8 },
  { name: 'Supplier B', reliability: 'B', onTime: 92, rating: 4.3 },
  { name: 'Supplier C', reliability: 'C', onTime: 85, rating: 3.9 },
  { name: 'Supplier D', reliability: 'A', onTime: 99, rating: 4.9 },
];

export function SupplierLeaderboard() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Supplier Performance</h3>
        <div className="text-sm text-slate-500">Top Suppliers</div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500">
              <th className="pb-2">Supplier</th>
              <th className="pb-2">Reliability</th>
              <th className="pb-2">On-Time %</th>
              <th className="pb-2">Rating</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.name} className="border-t border-gray-100">
                <td className="py-3">{s.name}</td>
                <td className="py-3 font-semibold">{s.reliability}</td>
                <td className="py-3">{s.onTime}%</td>
                <td className="py-3">{s.rating.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
