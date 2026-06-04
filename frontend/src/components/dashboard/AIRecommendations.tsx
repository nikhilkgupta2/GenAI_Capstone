import { motion } from 'framer-motion';
import React from 'react';
import type { RecommendationItem } from '../../hooks/dashboard/useRecommendations';

interface Props {
  recommendations?: RecommendationItem[];
}

export function AIRecommendations({ recommendations = [] }: Props) {
  const fallback = [
    { id: 1, name: 'Restock Product A', units: 24, priority: 'High' as const },
    { id: 2, name: 'Reduce Overstock Product B', units: 0, priority: 'Medium' as const },
    { id: 3, name: 'Supplier Risk Warning - ABC', units: 0, priority: 'High' as const },
    { id: 4, name: 'Slow Moving Product Alert', units: 0, priority: 'Low' as const },
    { id: 5, name: 'Demand Spike Prediction - SKU 45', units: 12, priority: 'High' as const },
  ];

  const items = recommendations.length ? recommendations : fallback;

  const badge = (p: string) =>
    p === 'High' ? 'bg-red-100 text-red-700' : p === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">AI Recommendations</h3>
        <button className="text-sm text-blue-500 font-semibold">See All</button>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-slate-50 p-3">
            <div>
              <p className="font-medium text-slate-900">{it.name}</p>
              <p className="text-xs text-slate-500">Suggested: {it.units ? `${it.units} units` : 'Action required'}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`${badge(it.priority)} rounded-full px-2 py-0.5 text-xs font-semibold`}>{it.priority}</span>
              <div className="flex items-center gap-2">
                <button className="rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-3 py-1 text-xs font-semibold text-white">Act</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
