import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export interface RiskSegment {
  name: string;
  value: number;
  color: string;
}

const USE_MOCK = true;

export function useRiskOverview() {
  return useQuery<RiskSegment[]>({
    queryKey: ['dashboard', 'riskOverview'],
    queryFn: async () => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 550));
        return [
          { name: 'Low', value: 130, color: '#22C55E' },
          { name: 'Medium', value: 85, color: '#F59E0B' },
          { name: 'High', value: 33, color: '#EF4444' },
        ];
      }

      const response = await api.get<RiskSegment[]>('/dashboard/risk-overview');
      return response.data;
    },
  });
}
