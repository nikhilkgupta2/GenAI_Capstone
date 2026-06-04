import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export interface RecommendationItem {
  id: number;
  name: string;
  units: number;
  priority: 'High' | 'Medium' | 'Low';
}

const USE_MOCK = true;

export function useRecommendations() {
  return useQuery<RecommendationItem[]>({
    queryKey: ['dashboard', 'recommendations'],
    queryFn: async () => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 520));
        return [
          { id: 1, name: 'Dell XPS 15', units: 8, priority: 'High' },
          { id: 2, name: 'Logitech MX Keys', units: 12, priority: 'Medium' },
          { id: 3, name: 'Anker 65W Charger', units: 20, priority: 'Low' },
        ];
      }

      const response = await api.get<RecommendationItem[]>('/dashboard/recommendations');
      return response.data;
    },
  });
}
