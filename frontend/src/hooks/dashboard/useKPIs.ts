import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { AlertTriangle, ArrowLeftRight, Package, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface SparklineDatum {
  v: number;
}

export interface KPIItem {
  id: string;
  title: string;
  value: string | number;
  subtitle: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  sparklineData: SparklineDatum[];
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}

type KPIResponse = {
  items: KPIItem[];
};

const USE_MOCK = true;

export function useKPIs() {
  return useQuery<KPIResponse>({
    queryKey: ['dashboard', 'kpis'],
    queryFn: async () => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return {
          items: [
            {
              id: 'kpi-1',
              title: 'Total Products',
              value: 248,
              subtitle: '3 added today',
              trend: 'up',
              trendValue: '+3',
              sparklineData: [{ v: 32 }, { v: 40 }, { v: 36 }, { v: 42 }, { v: 48 }],
              icon: Package,
              iconColor: 'text-blue-600',
              iconBg: 'bg-blue-50',
            },
            {
              id: 'kpi-2',
              title: 'Low Stock',
              value: 12,
              subtitle: '4 critical alerts',
              trend: 'down',
              trendValue: '-2',
              sparklineData: [{ v: 22 }, { v: 18 }, { v: 16 }, { v: 14 }, { v: 12 }],
              icon: AlertTriangle,
              iconColor: 'text-red-500',
              iconBg: 'bg-red-50',
            },
            {
              id: 'kpi-3',
              title: 'Transactions (7d)',
              value: 43,
              subtitle: '+12% vs last week',
              trend: 'up',
              trendValue: '+12%',
              sparklineData: [{ v: 28 }, { v: 32 }, { v: 34 }, { v: 38 }, { v: 43 }],
              icon: ArrowLeftRight,
              iconColor: 'text-green-600',
              iconBg: 'bg-green-50',
            },
            {
              id: 'kpi-4',
              title: 'Inventory Health',
              value: '92%',
              subtitle: 'Excellent',
              trend: 'up',
              trendValue: '+1%',
              sparklineData: [{ v: 80 }, { v: 84 }, { v: 88 }, { v: 90 }, { v: 92 }],
              icon: ShieldCheck,
              iconColor: 'text-purple-600',
              iconBg: 'bg-purple-50',
            },
          ],
        };
      }

      const response = await api.get<KPIResponse>('/dashboard/kpis');
      return response.data;
    },
  });
}
