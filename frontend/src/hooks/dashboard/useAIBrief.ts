import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export interface AIBriefItem {
  id: number;
  insight: string;
}

const USE_MOCK = true;

export function useAIBrief() {
  return useQuery<AIBriefItem[]>({
    queryKey: ['dashboard', 'aiBrief'],
    queryFn: async () => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 520));
        return [
          { id: 1, insight: '5 products are at risk of stockout in the next 7 days' },
          { id: 2, insight: 'Electronics demand increased by 15% this month' },
          { id: 3, insight: '2 suppliers are showing approval delays' },
          { id: 4, insight: 'Reorder value this week is estimated at ₹4,821' },
          { id: 5, insight: 'Inventory health improved by 1% since last week' },
        ];
      }

      const response = await api.get<AIBriefItem[]>('/dashboard/ai-brief');
      return response.data;
    },
  });
}
