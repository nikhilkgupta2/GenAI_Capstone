import {
  Boxes,
  ClipboardList,
  History,
  LayoutDashboard,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UploadCloud,
  Users,
  Warehouse,
  Bell,
  Activity,
  CreditCard,
  Lock,
  LifeBuoy,
  Settings,
  Layers,
  Globe,
  Crown,
} from 'lucide-react';

import type { UserRole } from '../lib/auth-store';
import { canAccessRoute } from '../permissions/capabilities';

export type NavigationItem = {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
};

export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

export const navigationGroups: NavigationGroup[] = [
  {
    label: 'Dashboard',
    items: [
      { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { to: '/products', label: 'Products', icon: Boxes },
      { to: '/inventory', label: 'Stock Management', icon: ClipboardList },
      { to: '/transactions', label: 'Inventory Transactions', icon: History },
      { to: '/warehouses', label: 'Warehouses', icon: Warehouse },
      { to: '/imports', label: 'Import Center', icon: UploadCloud },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
      { to: '/suppliers', label: 'Suppliers', icon: Truck },
      { to: '/approvals', label: 'Approvals', icon: ShieldCheck },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/users', label: 'Users', icon: Users },
      { to: '/audit-logs', label: 'Audit Logs', icon: History },
    ],
  },
];

export const superAdminNavigationGroups: NavigationGroup[] = [
  {
    label: 'Super Admin',
    items: [
      { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { to: '/tenants', label: 'Tenants', icon: Globe },
      { to: '/approvals', label: 'Approvals', icon: ShieldCheck },
      { to: '/users', label: 'Users', icon: Users },
      { to: '/audit-logs', label: 'Audit Logs', icon: History },
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/system-health', label: 'System Health', icon: Activity },
      { to: '/billing', label: 'Billing', icon: CreditCard },
      { to: '/permissions', label: 'Permissions', icon: Lock },
      { to: '/support-center', label: 'Support Center', icon: LifeBuoy },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function getVisibleNavigationGroups(role?: UserRole | null) {
  if (role === 'super_admin') {
    return superAdminNavigationGroups;
  }
  const visible = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        return canAccessRoute(item.to, role);
      }),
    }))
    .filter((group) => group.items.length > 0);

  if (role === 'retailer_admin') {
    return [
      ...visible,
      {
        label: 'Premium',
        items: [{ to: '/upgrade', label: 'Upgrade to Pro', icon: Crown }],
      },
    ];
  }

  return visible;
}

export function getRouteLabel(pathname: string) {
  const allGroups = [...navigationGroups, ...superAdminNavigationGroups];
  for (const group of allGroups) {
    const match = group.items.find((item) => item.to === pathname);
    if (match) {
      return { group: group.label, label: match.label };
    }
  }
  if (pathname === '/upgrade') {
    return { group: 'Premium', label: 'Upgrade to Pro' };
  }
  if (/^\/purchase-orders\/[^/]+$/.test(pathname)) {
    return { group: 'Operations', label: 'Purchase Order Detail' };
  }
  if (/^\/suppliers\/[^/]+$/.test(pathname)) {
    return { group: 'Operations', label: 'Supplier Profile' };
  }
  if (/^\/products\/new$/.test(pathname)) {
    return { group: 'Inventory', label: 'New Product' };
  }
  if (pathname === '/imports') {
    return { group: 'Inventory', label: 'Import Center' };
  }
  if (/^\/products\/[^/]+\/edit$/.test(pathname)) {
    return { group: 'Inventory', label: 'Edit Product' };
  }
  if (/^\/tenants\/[^/]+$/.test(pathname)) {
    return { group: 'Management', label: 'Tenant Overview' };
  }
  return { group: 'Workspace', label: 'IMS' };
}
