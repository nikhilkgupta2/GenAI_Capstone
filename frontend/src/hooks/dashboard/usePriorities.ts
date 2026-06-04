import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export interface PriorityItem {
  id: number;
  product: string;
  desc: string;
  priority: 'High' | 'Medium' | 'Low';
  delay: string;
}

const USE_MOCK = true;

export function usePriorities() {
  return useQuery<PriorityItem[]>({
    queryKey: ['dashboard', 'priorities'],
    queryFn: async () => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return [
          {
            id: 1,
            product: 'Dell XPS 15',
            desc: 'Will stock out in 5 days',
            priority: 'High',
            delay: '4 days',
          },
          {
            id: 2,
            product: 'Purchase Order #4521',
            desc: 'Pending for 3 days',
            priority: 'Medium',
            delay: '3 days',
          },
          {
            id: 3,
            product: 'Warehouse B Inventory',
            desc: 'Increased 15% this week',
            priority: 'Low',
            delay: '1 day',
          },
        ];
      }

      const response = await api.get<PriorityItem[]>('/dashboard/priorities');
      return response.data;
    },
  });
}
