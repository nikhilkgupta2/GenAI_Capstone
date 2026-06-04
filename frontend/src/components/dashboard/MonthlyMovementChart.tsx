import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import React from 'react';

interface Props {
  className?: string;
}

const mock = Array.from({ length: 12 }).map((_, i) => ({
  month: `M${i + 1}`,
  incoming: Math.round(400 + Math.random() * 300),
  outgoing: Math.round(300 + Math.random() * 260),
  transfers: Math.round(40 + Math.random() * 60),
}));

export function MonthlyMovementChart({ className }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className={`rounded-2xl bg-white p-5 shadow-sm border border-gray-100 ${className ?? ''}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Monthly Inventory Movement</h3>
        <p className="text-sm text-slate-500">Incoming / Outgoing / Transfers</p>
      </div>

      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mock} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fill: '#64748B' }} />
            <YAxis tick={{ fill: '#64748B' }} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="incoming" stroke="#4F46E5" fillOpacity={1} fill="url(#g1)" />
            <Area type="monotone" dataKey="outgoing" stroke="#10B981" fillOpacity={0.8} fill="url(#g2)" />
            <Area type="monotone" dataKey="transfers" stroke="#F59E0B" fillOpacity={0.2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
