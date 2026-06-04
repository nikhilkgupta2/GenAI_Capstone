import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';
import { motion } from 'framer-motion';
import React from 'react';

const mock = Array.from({ length: 14 }).map((_, i) => ({
  day: `D${i + 1}`,
  forecast: Math.round(40 + Math.random() * 120),
  trend: Math.round(30 + Math.random() * 90),
}));

export function PredictedDemandForecast() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Predicted Demand Forecast</h3>
        <div className="text-sm text-slate-500">Next 7 / 30 / 90 days</div>
      </div>

      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={mock} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fill: '#64748B' }} />
            <YAxis tick={{ fill: '#64748B' }} />
            <Tooltip />
            <CartesianGrid strokeDasharray="3 3" />
            <Bar dataKey="forecast" barSize={18} fill="#4F46E5" radius={[6, 6, 0, 0]} />
            <Line type="monotone" dataKey="trend" stroke="#F59E0B" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
