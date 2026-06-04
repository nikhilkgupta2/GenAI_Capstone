import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { InventoryOverviewChart } from './InventoryOverviewChart';
import { MonthlyMovementChart } from './MonthlyMovementChart';

const tabs = ['Sales Intelligence', 'Inventory Intelligence', 'Procurement Intelligence', 'Warehouse Intelligence'];

export function AIAnalyticsTabs() {
  const [active, setActive] = useState(0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">AI Analytics</h3>
        <div className="flex items-center gap-2">
          {tabs.map((t, i) => (
            <button key={t} onClick={() => setActive(i)} className={`text-sm px-3 py-1 rounded-full ${i === active ? 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white' : 'bg-slate-50 text-slate-700'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <InventoryOverviewChart />
        </div>
        <div>
          <MonthlyMovementChart />
        </div>
      </div>
    </motion.div>
  );
}
