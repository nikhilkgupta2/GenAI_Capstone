import { motion } from 'framer-motion';
import React from 'react';
import type { AIBriefItem } from '../../hooks/dashboard/useAIBrief';

interface Props {
  aiBrief?: AIBriefItem[];
}

export function AIInsightsSummary({ aiBrief = [] }: Props) {
  const fallback = [
    { id: 1, insight: 'Top selling product: Wireless Mouse' },
    { id: 2, insight: 'Fastest moving SKU: SKU-1234' },
    { id: 3, insight: 'Most active warehouse: Warehouse A' },
    { id: 4, insight: 'Highest inventory value product: Premium Monitor' },
    { id: 5, insight: 'Dead stock count: 12' },
  ];

  const items = aiBrief.length ? aiBrief : fallback;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">AI Insights Summary</h3>
        <button className="text-sm text-blue-500 font-semibold">Export</button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.slice(0, 4).map((it) => (
          <div key={it.id} className="rounded-lg bg-gradient-to-r from-white to-slate-50 p-3 shadow-inner">
            <p className="text-sm font-semibold text-slate-900">{it.insight}</p>
          </div>
        ))}
        <div className="rounded-lg bg-slate-50 p-3">Additional insights available</div>
      </div>
    </motion.div>
  );
}
