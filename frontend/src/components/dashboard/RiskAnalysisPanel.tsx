import React from 'react';
import { motion } from 'framer-motion';

const risks = [
  { id: 'over', label: 'Overstock Risk', value: 'Moderate', color: '#F59E0B' },
  { id: 'out', label: 'Stockout Risk', value: 'Low', color: '#10B981' },
  { id: 'sup', label: 'Supplier Risk', value: 'High', color: '#EF4444' },
  { id: 'rev', label: 'Revenue Risk', value: 'Moderate', color: '#F59E0B' },
];

export function RiskAnalysisPanel() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Risk Analysis</h3>
        <div className="text-sm text-slate-500">Overview</div>
      </div>

      <div className="mt-4 grid gap-3">
        {risks.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-slate-50 p-3">
            <div>
              <p className="text-sm font-medium text-slate-900">{r.label}</p>
              <p className="text-xs text-slate-500">Status</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: r.color }} />
              <span className="text-sm font-semibold">{r.value}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
