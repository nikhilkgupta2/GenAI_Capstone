import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export interface DemandTrendItem {
  cat: string;
  change: number;
  data: number[];
}

const USE_MOCK = true;

export function useDemandTrends() {
  return useQuery<DemandTrendItem[]>({
    queryKey: ['dashboard', 'demandTrends'],
    queryFn: async () => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return [
          { cat: 'Electronics', change: 8.5, data: [10, 14, 12, 18, 22, 20, 25] },
          { cat: 'Accessories', change: 2.1, data: [8, 9, 8, 10, 11, 10, 12] },
          { cat: 'Networking', change: -5.0, data: [15, 13, 12, 10, 9, 8, 7] },
          { cat: 'Peripherals', change: 3.2, data: [5, 6, 7, 6, 8, 9, 10] },
          { cat: 'Storage', change: -1.8, data: [12, 11, 10, 11, 9, 10, 8] },
        ];
      }

      const response = await api.get<DemandTrendItem[]>('/dashboard/demand-trends');
      return response.data;
    },
  });
}
