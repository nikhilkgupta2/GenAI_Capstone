import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export interface SupplierHealthItem {
  id: number;
  name: string;
  initials: string;
  risk: 'High' | 'Medium' | 'Low';
  lead: string;
  health: number;
}

const USE_MOCK = true;

export function useSupplierHealth() {
  return useQuery<SupplierHealthItem[]>({
    queryKey: ['dashboard', 'supplierHealth'],
    queryFn: async () => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 540));
        return [
          { id: 1, name: 'ABC Supplier', initials: 'AB', risk: 'High', lead: '1.2 days', health: 30 },
          { id: 2, name: 'Dell Inc', initials: 'DL', risk: 'Medium', lead: '2.1 days', health: 60 },
          { id: 3, name: 'XYZ Supplies', initials: 'XY', risk: 'Low', lead: '0.8 days', health: 85 },
          { id: 4, name: 'Global Traders', initials: 'GT', risk: 'Medium', lead: '3.5 days', health: 55 },
        ];
      }

      const response = await api.get<SupplierHealthItem[]>('/dashboard/supplier-health');
      return response.data;
    },
  });
}
