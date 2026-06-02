import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { getTokenExpiry } from './auth-token';

export type UserRole =
  | 'super_admin'
  | 'retailer_admin'
  | 'inventory_manager'
  | 'warehouse_staff'
  | 'auditor'
  | 'procurement_manager';

export type AuthUser = {
  id: string;
  tenant_id: string | null;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_email_verified?: boolean;
  assigned_warehouse?: string | null;
  company_name?: string | null;
};

type AuthState = {
  token: string | null;
  tokenExpiresAt: number | null;
  user: AuthUser | null;
  selectedTenantId: string | null;
  setSession: (token: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  setSelectedTenantId: (tenantId: string | null) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      tokenExpiresAt: null,
      user: null,
      selectedTenantId: null,
      setSession: (token, user) => set({ token, tokenExpiresAt: getTokenExpiry(token), user, selectedTenantId: null }),
      setUser: (user) => set((state) => ({ user, selectedTenantId: user.role === 'super_admin' ? state.selectedTenantId : null })),
      setSelectedTenantId: (tenantId) => set({ selectedTenantId: tenantId }),
      clearSession: () => set({ token: null, tokenExpiresAt: null, user: null, selectedTenantId: null }),
    }),
    {
      name: 'ims-auth',
    },
  ),
);
