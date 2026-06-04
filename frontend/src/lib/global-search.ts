import type { UserRole } from './auth-store';
import { listApprovals } from './audit-api';
import { listProducts } from './product-api';
import { listPurchaseOrders, listSuppliers } from './procurement-api';
import { getTenants } from './super-admin-api';
import { listUsersPage } from './user-api';
import { listStockTransfers, listWarehouseInventory, listWarehouses } from './warehouse-api';

export type GlobalSearchCategory =
  | 'Products'
  | 'Inventory'
  | 'Warehouses'
  | 'Purchase Orders'
  | 'Suppliers'
  | 'Approvals'
  | 'Audit Logs'
  | 'Tenants'
  | 'Users';

export type GlobalSearchResult = {
  id: string;
  category: GlobalSearchCategory;
  title: string;
  subtitle: string;
  href: string;
};

function includesQuery(value: unknown, query: string) {
  return String(value ?? '').toLowerCase().includes(query.toLowerCase());
}

function uniqueResults(results: GlobalSearchResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = `${result.category}:${result.id}:${result.href}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function safeSearch(fn: () => Promise<GlobalSearchResult[]>) {
  try {
    return await fn();
  } catch {
    return [];
  }
}

export async function globalSearch(query: string, role?: UserRole | null, limitPerCategory = 8) {
  const q = query.trim();
  if (!q || !role) return [];

  const searches: Array<Promise<GlobalSearchResult[]>> = [];

  if (role === 'super_admin') {
    searches.push(
      safeSearch(async () => {
        const tenants = await getTenants(q);
        return tenants.slice(0, limitPerCategory).map((tenant) => ({
          id: tenant.id,
          category: 'Tenants' as const,
          title: tenant.company_name,
          subtitle: `${tenant.contact_email} · ${tenant.status} · ${tenant.plan}`,
          href: `/tenants/${tenant.id}`,
        }));
      }),
      safeSearch(async () => {
        const { users } = await listUsersPage({ search: q, limit: limitPerCategory });
        return users.map((user) => ({
          id: user.id,
          category: 'Users' as const,
          title: user.name,
          subtitle: `${user.email} · ${user.role.replace(/_/g, ' ')}`,
          href: '/users',
        }));
      }),
    );
  }

  if (['retailer_admin', 'inventory_manager', 'warehouse_staff', 'auditor', 'procurement_manager'].includes(role)) {
    searches.push(
      safeSearch(async () => {
        const byName = await listProducts({ product_name: q, limit: limitPerCategory });
        const bySku = await listProducts({ sku: q, limit: limitPerCategory });
        return uniqueResults([...byName, ...bySku].map((product) => ({
          id: product.id,
          category: 'Products' as const,
          title: product.product_name,
          subtitle: `${product.sku} · ${product.quantity} on hand · ${product.warehouse_location || 'Unassigned'}`,
          href: `/products/${product.id}`,
        }))).slice(0, limitPerCategory);
      }),
      safeSearch(async () => {
        const inventory = await listWarehouseInventory({ search: q });
        return inventory.slice(0, limitPerCategory).map((item) => ({
          id: item.id,
          category: 'Inventory' as const,
          title: item.product_name,
          subtitle: `${item.sku} · ${item.quantity} units · ${item.stock_status.replace(/_/g, ' ')}`,
          href: '/warehouses',
        }));
      }),
      safeSearch(async () => {
        const warehouses = await listWarehouses({ search: q });
        return warehouses.slice(0, limitPerCategory).map((warehouse) => ({
          id: warehouse.id,
          category: 'Warehouses' as const,
          title: warehouse.name,
          subtitle: `${warehouse.code} · ${warehouse.total_units} units · ${warehouse.low_stock_items} low-stock items`,
          href: '/warehouses',
        }));
      }),
    );
  }

  if (role === 'retailer_admin' || role === 'procurement_manager') {
    searches.push(
      safeSearch(async () => {
        const { purchaseOrders } = await listPurchaseOrders({ search: q, limit: limitPerCategory });
        return purchaseOrders.map((order) => ({
          id: order.id,
          category: 'Purchase Orders' as const,
          title: order.po_number,
          subtitle: `${order.supplier_name} · ${order.status.replace(/_/g, ' ')} · ${order.total_ordered} ordered`,
          href: `/purchase-orders/${order.id}`,
        }));
      }),
      safeSearch(async () => {
        const { suppliers } = await listSuppliers({ search: q, limit: limitPerCategory });
        return suppliers.map((supplier) => ({
          id: supplier.id,
          category: 'Suppliers' as const,
          title: supplier.name,
          subtitle: `${supplier.contact_email || supplier.contact_phone || 'No contact'} · ${supplier.status}`,
          href: `/suppliers/${supplier.id}`,
        }));
      }),
    );
  }

  if (role === 'retailer_admin') {
    searches.push(
      safeSearch(async () => {
        const approvals = await listApprovals();
        return approvals
          .filter((item) => includesQuery(item.title, q) || includesQuery(item.description, q) || includesQuery(item.status, q))
          .slice(0, limitPerCategory)
          .map((item) => ({
            id: item.id,
            category: 'Approvals' as const,
            title: item.title,
            subtitle: `${item.type.replace(/_/g, ' ')} · ${item.status}`,
            href: '/approvals',
          }));
      }),
    );
  }

  if (role === 'retailer_admin' || role === 'inventory_manager' || role === 'warehouse_staff') {
    searches.push(
      safeSearch(async () => {
        const transfers = await listStockTransfers();
        return transfers
          .filter((item) =>
            includesQuery(item.product_name, q) ||
            includesQuery(item.sku, q) ||
            includesQuery(item.source_warehouse_name, q) ||
            includesQuery(item.destination_warehouse_name, q) ||
            includesQuery(item.status, q)
          )
          .slice(0, limitPerCategory)
          .map((item) => ({
            id: item.id,
            category: 'Warehouses' as const,
            title: item.product_name,
            subtitle: `${item.source_warehouse_name} to ${item.destination_warehouse_name} · ${item.status}`,
            href: '/warehouses',
          }));
      }),
    );
  }

  const results = uniqueResults((await Promise.all(searches)).flat());
  return results;
}
