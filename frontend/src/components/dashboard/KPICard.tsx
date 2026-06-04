import type { LucideIcon } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Minus } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  sparklineData: { v: number }[];
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  delay?: number;
}

const trendMeta = {
  up: {
    icon: ChevronUp,
    className: 'bg-green-100 text-green-700',
  },
  down: {
    icon: ChevronDown,
    className: 'bg-red-100 text-red-700',
  },
  neutral: {
    icon: Minus,
    className: 'bg-gray-100 text-gray-500',
  },
};

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  sparklineData,
  icon: Icon,
  iconColor,
  iconBg,
  delay = 0,
}: KPICardProps) {
  const TrendIcon = trendMeta[trend].icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className={cn('grid h-11 w-11 place-items-center rounded-full', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
        <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', trendMeta[trend].className)}>
          <TrendIcon className="mr-1 inline h-3 w-3" /> {trendValue}
        </span>
      </div>
      <div className="mt-5">
        <p className="text-3xl font-bold text-slate-950">{value}</p>
        <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className="mt-4 h-10 w-full">
        <ResponsiveContainer width="100%" height={40}>
          <LineChart data={sparklineData}>
            <Line type="monotone" dataKey="v" stroke="#4F6EF7" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
