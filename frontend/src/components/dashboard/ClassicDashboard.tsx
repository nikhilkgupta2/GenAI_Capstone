import { motion } from 'framer-motion';
import { ArrowUpCircle, AlertCircle, Boxes, PackageCheck, Building2, ClipboardList } from 'lucide-react';

import { SectionCard, SectionHeader } from '../ui/Page';
import { StatWidget } from '../ui/StatWidget';
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from '../ui/DataTable';
import type { Product } from '../../lib/product-api';
import type { RetailerDashboard, WarehousePerformance, RecentTransaction } from '../../lib/dashboard-api';

function MovementWidget({ summary }: { summary: { stock_in: number; stock_out: number; adjustment: number } }) {
  const items = [
    ['Stock in', summary.stock_in],
    ['Stock out', summary.stock_out],
    ['Adjustments', Math.abs(summary.adjustment)],
  ] as const;
  const max = Math.max(1, ...items.map(([, value]) => value));

  return (
    <SectionCard>
      <SectionHeader title="Inventory activity" description="Operational movement summaries for recent stock events." />
      <div className="p-5 space-y-4">
        {items.map(([label, value]) => (
          <div key={label}>
            <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
              <span>{label}</span>
              <span className="font-semibold text-slate-900">{value.toLocaleString()}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-slate-900" style={{ width: `${Math.max(6, (value / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function RecentActivity({ transactions }: { transactions: RecentTransaction[] }) {
  return (
    <SectionCard>
      <SectionHeader title="Recent transactions" description="Latest stock movements recorded in the dashboard." />
      {transactions.length === 0 ? (
        <div className="p-5 text-sm text-slate-500">No transactions have been recorded yet.</div>
      ) : (
        <DataTable className="rounded-none border-x-0 border-b-0 shadow-none">
          <DataTableHeader>
            <tr>
              <DataTableHead>Product</DataTableHead>
              <DataTableHead>Type</DataTableHead>
              <DataTableHead className="text-right">Qty</DataTableHead>
              <DataTableHead>Time</DataTableHead>
            </tr>
          </DataTableHeader>
          <DataTableBody>
            {transactions.slice(0, 6).map((transaction) => (
              <DataTableRow key={transaction.id}>
                <DataTableCell className="font-medium text-slate-900">{transaction.product_name}</DataTableCell>
                <DataTableCell>{transaction.transaction_type.replace('_', ' ')}</DataTableCell>
                <DataTableCell className="text-right font-medium text-slate-900">{transaction.quantity}</DataTableCell>
                <DataTableCell>
                  {new Intl.DateTimeFormat(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(transaction.created_at))}
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </SectionCard>
  );
}

function WarehouseOverview({ performance }: { performance: WarehousePerformance[] }) {
  return (
    <SectionCard>
      <SectionHeader title="Warehouse overview" description="Warehouse stock depth, product coverage, and low-stock exposure." />
      {performance.length === 0 ? (
        <div className="p-5 text-sm text-slate-500">No warehouses have been stocked yet.</div>
      ) : (
        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
          {performance.map((warehouse) => (
            <div key={warehouse.warehouse_id} className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">{warehouse.name}</p>
              <p className="mt-1 text-sm text-slate-500">{warehouse.product_count} products · {warehouse.low_stock_items} low-stock</p>
              <div className="mt-3 flex items-center justify-between gap-2 text-sm text-slate-600">
                <span>Total units</span>
                <span>{warehouse.total_units.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export function ClassicDashboard({
  dashboard,
}: {
  dashboard: RetailerDashboard;
}) {
  const transactionCount = dashboard.recent_transactions.length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatWidget title="Total products" value={dashboard.total_products.toLocaleString()} icon={Boxes} />
        <StatWidget title="Low-stock products" value={dashboard.low_stock_products.toLocaleString()} icon={AlertCircle} tone="warning" />
        <StatWidget title="Transactions" value={transactionCount.toLocaleString()} icon={ArrowUpCircle} />
        <StatWidget title="Inventory quantity" value={dashboard.total_inventory_quantity.toLocaleString()} icon={PackageCheck} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(280px,420px)_1fr]">
        <MovementWidget summary={dashboard.movement_summary} />
        <RecentActivity transactions={dashboard.recent_transactions} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <WarehouseOverview performance={dashboard.warehouse_performance} />
        <SectionCard>
          <SectionHeader title="Purchase orders" description="Status of active orders and fulfillment progress." />
          <div className="space-y-4 p-5 text-sm text-slate-600">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Total purchase orders</p>
              <p>{dashboard.total_purchase_orders.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Pending orders</p>
              <p>{dashboard.pending_purchase_orders.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Completed orders</p>
              <p>{dashboard.completed_purchase_orders.toLocaleString()}</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </motion.div>
  );
}
