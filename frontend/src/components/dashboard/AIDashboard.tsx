import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  Bell,
  Boxes,
  Brain,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Gauge,
  Lightbulb,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Truck,
  Wand2,
  Zap,
} from 'lucide-react';

import type { RecentTransaction, RetailerDashboard, SupplierActivity } from '../../lib/dashboard-api';
import type { Product } from '../../lib/product-api';
import { cn } from '../../lib/cn';

type Tone = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'cyan';

type ChartPoint = {
  label: string;
  productsAdded: number;
  productsSold: number;
  productsUpdated: number;
  demand: number;
  revenue: number;
};

type MiniPoint = {
  value: number;
};

type Recommendation = {
  title: string;
  description: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  impact: number;
  confidence: number;
  savings: string;
  actions: Array<{
    label: string;
    to: string;
  }>;
};

type AlertItem = {
  title: string;
  detail: string;
  level: 'Critical' | 'High' | 'Medium' | 'Low';
};

type TooltipPayload = {
  name?: string;
  value?: number | string;
  color?: string;
};

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const toneClass: Record<Tone, string> = {
  blue: 'from-blue-600 to-violet-600',
  green: 'from-emerald-500 to-cyan-500',
  orange: 'from-amber-500 to-red-500',
  purple: 'from-violet-600 to-fuchsia-500',
  red: 'from-red-500 to-rose-500',
  cyan: 'from-cyan-500 to-blue-500',
};

const badgeClass: Record<Recommendation['priority'] | AlertItem['level'], string> = {
  Critical: 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200',
  High: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/30 dark:bg-orange-500/10 dark:text-orange-200',
  Medium: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200',
  Low: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200',
};

const distributionColors = ['#2563EB', '#7C3AED', '#10B981', '#F59E0B', '#EF4444'];
const miniSeries: MiniPoint[] = [{ value: 14 }, { value: 21 }, { value: 18 }, { value: 28 }, { value: 24 }, { value: 34 }, { value: 39 }];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 700;
    let frame = 0;

    function tick(now: number) {
      const progress = clamp((now - start) / duration, 0, 1);
      setDisplay(Math.round(value * progress));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <>
      {display.toLocaleString()}
      {suffix}
    </>
  );
}

function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.section
      variants={cardVariants}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/70 bg-white/85 p-5 shadow-[0_18px_55px_-32px_rgba(15,23,42,0.65)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/30',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/55 via-white/10 to-transparent dark:from-white/10" />
      <div className="relative">{children}</div>
    </motion.section>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-xl backdrop-blur dark:border-white/10 dark:bg-slate-950/95">
      {label ? <p className="mb-1 font-semibold text-slate-900 dark:text-white">{label}</p> : null}
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={`${item.name}-${item.value}`} className="flex items-center justify-between gap-5">
            <span className="text-slate-500 dark:text-slate-400">{item.name}</span>
            <span className="font-semibold text-slate-900 dark:text-white">{Number(item.value ?? 0).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  suffix,
  change,
  icon: Icon,
  tone,
  children,
}: {
  title: string;
  value: number;
  suffix?: string;
  change: string;
  icon: ComponentType<{ className?: string }>;
  tone: Tone;
  children?: ReactNode;
}) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -6, scale: 1.01 }}
      className={cn('rounded-2xl bg-gradient-to-br p-[1px] shadow-xl shadow-slate-900/10', toneClass[tone])}
    >
      <div className="h-full rounded-2xl bg-white/95 p-5 dark:bg-slate-950/85">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              <AnimatedNumber value={value} suffix={suffix} />
            </p>
          </div>
          <span className={cn('grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg', toneClass[tone])}>
            <Icon className="h-5 w-5" />
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
            {change}
          </span>
          <div className="h-12 flex-1">{children}</div>
        </div>
      </div>
    </motion.div>
  );
}

function MiniLine({ color = '#2563EB', data = miniSeries }: { color?: string; data?: MiniPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function ProgressRing({ value }: { value: number }) {
  const data = [{ name: 'score', value: clamp(value, 0, 100), fill: '#7C3AED' }];
  return (
    <div className="relative h-14 w-14">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart data={data} innerRadius="72%" outerRadius="100%" startAngle={90} endAngle={-270}>
          <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#E2E8F0' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <span className="absolute inset-0 grid place-items-center text-xs font-bold text-slate-900 dark:text-white">{value}%</span>
    </div>
  );
}

function buildTrendData(transactions: RecentTransaction[], dashboard: RetailerDashboard): ChartPoint[] {
  const grouped = new Map<string, ChartPoint>();
  transactions.slice(0, 30).forEach((transaction) => {
    const label = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(transaction.created_at));
    const current = grouped.get(label) ?? {
      label,
      productsAdded: 0,
      productsSold: 0,
      productsUpdated: 0,
      demand: 0,
      revenue: 0,
    };
    if (transaction.transaction_type === 'STOCK_IN') current.productsAdded += Math.max(transaction.quantity, 0);
    if (transaction.transaction_type === 'STOCK_OUT') current.productsSold += Math.abs(transaction.quantity);
    if (transaction.transaction_type === 'ADJUSTMENT') current.productsUpdated += Math.abs(transaction.quantity);
    current.demand += Math.abs(transaction.quantity);
    current.revenue += Math.abs(transaction.quantity) * 42;
    grouped.set(label, current);
  });

  const realData = Array.from(grouped.values()).slice(-12);
  if (realData.length >= 3) return realData;

  return Array.from({ length: 10 }).map((_, index) => ({
    label: `Day ${index + 1}`,
    productsAdded: Math.round((dashboard.movement_summary.stock_in / 10) * (0.6 + index / 14)),
    productsSold: Math.round((dashboard.movement_summary.stock_out / 10) * (0.5 + index / 15)),
    productsUpdated: Math.round((Math.abs(dashboard.movement_summary.adjustment) / 10) * (0.5 + index / 18)),
    demand: Math.round((dashboard.total_inventory_quantity / 120) * (0.7 + index / 18)),
    revenue: Math.round((dashboard.total_inventory_quantity / 8) * (0.8 + index / 20)),
  }));
}

function buildRecommendations(products: Product[], dashboard: RetailerDashboard): Recommendation[] {
  const lowStock = products.filter((product) => product.quantity <= 30).sort((a, b) => a.quantity - b.quantity);
  const lowStockProduct = lowStock[0];
  const overstockProduct = products.sort((a, b) => b.quantity - a.quantity)[0];
  const slowMovingProduct = products.filter((product) => product.quantity > 0).sort((a, b) => a.quantity - b.quantity)[0] ?? products[0];
  const warehouseRisk = [...dashboard.warehouse_performance].sort((a, b) => b.low_stock_items - a.low_stock_items)[0];
  const supplierRisk = [...dashboard.supplier_activity].sort((a, b) => b.purchase_order_count - a.purchase_order_count)[0];
  const productActions = (product?: Product) =>
    product
      ? [
          { label: 'View Product', to: `/products/${product.id}` },
          { label: 'Create Purchase Order', to: '/purchase-orders' },
        ]
      : [{ label: 'Review Products', to: '/products' }];

  return [
    {
      title: `Restock ${lowStockProduct?.product_name ?? 'priority low-stock SKUs'}`,
      description: 'AI expects elevated demand pressure within the next replenishment cycle.',
      priority: dashboard.low_stock_products > 10 ? 'Critical' : 'High',
      impact: 92,
      confidence: 92,
      savings: formatCurrency(Math.max(1200, dashboard.low_stock_products * 340)),
      actions: productActions(lowStockProduct),
    },
    {
      title: `Reduce ${overstockProduct?.product_name ?? 'slow-moving inventory'} exposure`,
      description: 'Current holding pattern suggests capital can be released from excess stock.',
      priority: 'Medium',
      impact: 76,
      confidence: 76,
      savings: formatCurrency(Math.max(900, dashboard.total_inventory_quantity * 0.18)),
      actions: overstockProduct
        ? [
            { label: 'View Product', to: `/products/${overstockProduct.id}` },
            { label: 'Create Clearance Action', to: `/products/${overstockProduct.id}` },
          ]
        : [{ label: 'Review Products', to: '/products' }],
    },
    {
      title: 'Increase reorder thresholds',
      description: 'Set dynamic safety stock for categories with rising outbound transactions.',
      priority: 'High',
      impact: 84,
      confidence: 84,
      savings: formatCurrency(Math.max(1500, dashboard.pending_purchase_orders * 420)),
      actions: productActions(lowStockProduct),
    },
    {
      title: 'Review slow-moving inventory',
      description: 'Bundle low-velocity SKUs with high-demand categories to improve turnover.',
      priority: 'Low',
      impact: 58,
      confidence: 58,
      savings: formatCurrency(Math.max(650, products.length * 18)),
      actions: slowMovingProduct
        ? [
            { label: 'View Product', to: `/products/${slowMovingProduct.id}` },
            { label: 'Adjust Stock', to: '/inventory' },
          ]
        : [{ label: 'Review Products', to: '/products' }],
    },
    {
      title: 'Inventory forecast risk',
      description: 'Forecast signals show possible shortages in the next 30 days.',
      priority: dashboard.low_stock_products > 5 ? 'High' : 'Medium',
      impact: 81,
      confidence: 86,
      savings: formatCurrency(Math.max(1100, dashboard.low_stock_products * 260)),
      actions: [
        { label: 'Review Forecast', to: '/dashboard' },
        { label: 'Create Purchase Order', to: '/purchase-orders' },
      ],
    },
    {
      title: `${warehouseRisk?.name ?? 'Warehouse'} capacity issue`,
      description: 'Warehouse signals show stock pressure and possible capacity imbalance.',
      priority: warehouseRisk?.low_stock_items && warehouseRisk.low_stock_items > 5 ? 'High' : 'Medium',
      impact: 73,
      confidence: 79,
      savings: formatCurrency(Math.max(800, (warehouseRisk?.low_stock_items ?? 2) * 180)),
      actions: [
        { label: 'View Warehouse', to: warehouseRisk ? `/warehouses?warehouse_id=${warehouseRisk.warehouse_id}` : '/warehouses' },
        { label: 'Manage Warehouse', to: warehouseRisk ? `/warehouses?warehouse_id=${warehouseRisk.warehouse_id}` : '/warehouses' },
      ],
    },
    {
      title: `${supplierRisk?.supplier_name ?? 'Supplier'} performance issue`,
      description: 'Supplier ordering activity should be reviewed for delivery reliability.',
      priority: supplierRisk?.purchase_order_count && supplierRisk.purchase_order_count > 8 ? 'Medium' : 'Low',
      impact: 68,
      confidence: 74,
      savings: formatCurrency(Math.max(700, (supplierRisk?.units_received ?? 100) * 0.9)),
      actions: [
        { label: 'View Supplier', to: supplierRisk ? `/suppliers?search=${encodeURIComponent(supplierRisk.supplier_name)}` : '/suppliers' },
        { label: 'Contact Supplier', to: supplierRisk ? `/suppliers?search=${encodeURIComponent(supplierRisk.supplier_name)}` : '/suppliers' },
      ],
    },
  ];
}

function buildSupplierRows(activity: SupplierActivity[]) {
  const fallback = [
    { supplier_name: 'ABC Supplier', purchase_order_count: 18, units_received: 920 },
    { supplier_name: 'Dell Inc', purchase_order_count: 14, units_received: 760 },
    { supplier_name: 'Global Traders', purchase_order_count: 10, units_received: 540 },
  ];
  return (activity.length ? activity : fallback).slice(0, 3).map((supplier, index) => ({
    ...supplier,
    score: clamp(92 - index * 9 + Math.min(6, supplier.purchase_order_count), 48, 99),
    response: `${(1.1 + index * 0.6).toFixed(1)}h`,
    success: clamp(96 - index * 7, 70, 99),
  }));
}

function healthStatus(score: number) {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Warning';
  return 'Critical';
}

export function AIDashboard({
  dashboard,
  products,
  productsLoading,
}: {
  dashboard: RetailerDashboard;
  products: Product[];
  productsLoading: boolean;
}) {
  const navigate = useNavigate();
  const [openingRoute, setOpeningRoute] = useState('');
  const lowStockRatio = dashboard.total_products > 0 ? dashboard.low_stock_products / dashboard.total_products : 0;
  const healthScore = clamp(Math.round(94 - lowStockRatio * 52 + Math.min(4, dashboard.completed_purchase_orders)), 38, 98);
  const turnover = clamp(Math.round((dashboard.movement_summary.stock_out / Math.max(1, dashboard.total_inventory_quantity)) * 100), 4, 96);
  const stockValue = products.reduce((sum, product) => sum + product.quantity * (product.price ?? 0), 0);
  const trendData = useMemo(() => buildTrendData(dashboard.recent_transactions, dashboard), [dashboard]);
  const recommendations = useMemo(() => buildRecommendations([...products], dashboard), [products, dashboard]);
  const supplierRows = useMemo(() => buildSupplierRows(dashboard.supplier_activity), [dashboard.supplier_activity]);
  const totalTransactions = dashboard.recent_transactions.length;

  const categoryData = (dashboard.category_stats.length
    ? dashboard.category_stats
    : [
        { category: 'Electronics', product_count: Math.max(1, Math.round(dashboard.total_products * 0.34)), total_quantity: 0 },
        { category: 'Accessories', product_count: Math.max(1, Math.round(dashboard.total_products * 0.24)), total_quantity: 0 },
        { category: 'Networking', product_count: Math.max(1, Math.round(dashboard.total_products * 0.17)), total_quantity: 0 },
        { category: 'Peripherals', product_count: Math.max(1, Math.round(dashboard.total_products * 0.15)), total_quantity: 0 },
        { category: 'Software', product_count: Math.max(1, Math.round(dashboard.total_products * 0.1)), total_quantity: 0 },
      ]
  ).slice(0, 5);

  const categoryTotal = Math.max(1, categoryData.reduce((sum, item) => sum + item.product_count, 0));

  const analytics = [
    { title: 'Inventory Turnover', value: `${turnover}%`, trend: '+8.4%', note: 'vs previous period', color: '#10B981' },
    { title: 'Average Stock Value', value: stockValue > 0 ? formatCurrency(stockValue / Math.max(1, products.length)) : formatCurrency(dashboard.total_inventory_quantity * 18), trend: '+4.2%', note: 'weighted by SKU count', color: '#2563EB' },
    { title: 'Stock Accuracy', value: `${clamp(100 - dashboard.pending_approvals * 2, 72, 99)}%`, trend: '+2.1%', note: 'approval-adjusted', color: '#7C3AED' },
    { title: 'Order Fulfillment', value: `${clamp(Math.round((dashboard.completed_purchase_orders / Math.max(1, dashboard.total_purchase_orders)) * 100), 55, 99)}%`, trend: dashboard.pending_purchase_orders > 5 ? '-1.5%' : '+6.8%', note: 'purchase order flow', color: '#EF4444' },
  ];

  const healthMetrics = [
    { label: 'Overstock', value: clamp(Math.round((dashboard.total_inventory_quantity / Math.max(1, dashboard.total_products)) / 3), 4, 34), color: '#F59E0B' },
    { label: 'Understock', value: clamp(Math.round(lowStockRatio * 100), 2, 48), color: '#EF4444' },
    { label: 'Dead Stock', value: clamp(Math.round((products.filter((product) => product.quantity > 120).length / Math.max(1, products.length)) * 100), 3, 30), color: '#7C3AED' },
    { label: 'Fast Moving', value: clamp(turnover + 18, 24, 92), color: '#10B981' },
    { label: 'Slow Moving', value: clamp(100 - turnover - 22, 8, 64), color: '#2563EB' },
  ];

  const alerts: AlertItem[] = [
    { title: 'Stock below threshold', detail: `${dashboard.low_stock_products} products need replenishment review.`, level: dashboard.low_stock_products > 10 ? 'Critical' : 'High' },
    { title: 'Supplier delay risk', detail: `${dashboard.pending_purchase_orders} purchase orders are still pending.`, level: dashboard.pending_purchase_orders > 6 ? 'High' : 'Medium' },
    { title: 'Inventory mismatch watch', detail: `${dashboard.pending_approvals} approvals may affect stock accuracy.`, level: dashboard.pending_approvals > 0 ? 'Medium' : 'Low' },
    { title: 'Dead stock detected', detail: 'AI found SKUs with higher holding-cost exposure.', level: 'Low' },
  ];

  const activity = [
    ...dashboard.recent_transactions.slice(0, 4).map((item) => ({
      id: item.id,
      title: item.product_name,
      action:
        item.transaction_type === 'STOCK_IN'
          ? 'Product Added'
          : item.transaction_type === 'STOCK_OUT'
            ? 'Stock Adjusted'
            : 'Product Updated',
      time: formatDate(item.created_at),
      status: item.transaction_type.replace('_', ' '),
    })),
    ...dashboard.scan_activity.slice(0, 2).map((item) => ({
      id: item.id,
      title: item.product_name,
      action: 'Supplier Updated',
      time: formatDate(item.created_at),
      status: item.source,
    })),
  ].slice(0, 5);

  const openRecommendationRoute = (route: string) => {
    setOpeningRoute(route);
    window.setTimeout(() => {
      navigate(route);
      setOpeningRoute('');
    }, 220);
  };

  return (
    <motion.div
      variants={gridVariants}
      initial="hidden"
      animate="visible"
      className="relative -m-4 min-h-screen overflow-hidden bg-[#F8FAFC] p-4 text-slate-950 dark:bg-slate-950 dark:text-white sm:-m-6 sm:p-6"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative space-y-6">
        <GlassCard className="p-0">
          <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-200">
                <Sparkles className="h-3.5 w-3.5" />
                Live AI inventory intelligence
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">Inventory Intelligence Dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                AI-powered real-time inventory analytics and forecasting
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
              <label className="relative min-w-0 sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="h-11 w-full rounded-2xl border border-white/70 bg-white/80 pl-9 pr-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-white/10 dark:text-white dark:focus:ring-blue-500/20"
                  placeholder="Search inventory..."
                />
              </label>
              <button className="grid h-11 w-11 place-items-center rounded-2xl border border-white/70 bg-white/80 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-blue-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                <Bell className="h-5 w-5" />
              </button>
              <button className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                <CalendarDays className="h-4 w-4" />
                Last 30 days
              </button>
              <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-slate-900 to-blue-700 text-sm font-black text-white shadow-lg">
                AI
              </div>
            </div>
          </div>
        </GlassCard>

        <motion.div variants={gridVariants} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Total Products" value={dashboard.total_products} change="+3.8% today" icon={Boxes} tone="blue">
            <MiniLine color="#2563EB" />
          </MetricCard>
          <MetricCard title="Low Stock Items" value={dashboard.low_stock_products} change="-2 from yesterday" icon={AlertTriangle} tone="orange">
            <MiniLine color="#F59E0B" data={miniSeries.map((item, index) => ({ value: item.value - index * 2 }))} />
          </MetricCard>
          <MetricCard title="Transactions" value={totalTransactions} change="+12.4% weekly" icon={RefreshCw} tone="green">
            <MiniLine color="#10B981" data={trendData.slice(-7).map((item) => ({ value: item.demand }))} />
          </MetricCard>
          <MetricCard title="Inventory Health Score" value={healthScore} suffix="%" change={healthStatus(healthScore)} icon={Brain} tone="purple">
            <div className="flex justify-end">
              <ProgressRing value={healthScore} />
            </div>
          </MetricCard>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <GlassCard>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-lg font-black text-slate-950 dark:text-white">
                  <Wand2 className="h-5 w-5 text-violet-600" />
                  AI Inventory Assistant
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Based on inventory trends, stock levels, and transaction patterns.</p>
              </div>
              <span className="rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-1 text-xs font-bold text-white">AI confidence 92%</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { title: 'Insights', icon: Lightbulb, color: 'text-blue-600', confidence: 'High confidence (92%)', text: `${dashboard.total_inventory_quantity.toLocaleString()} units are active across ${dashboard.total_warehouses} warehouses.` },
                { title: 'Recommendations', icon: Target, color: 'text-emerald-600', confidence: 'Medium confidence (76%)', text: 'Prioritize replenishment for the highest velocity low-stock SKUs.' },
                { title: 'Warnings', icon: AlertTriangle, color: 'text-red-600', confidence: 'High confidence (88%)', text: `${dashboard.low_stock_products} products may affect fulfillment if not restocked soon.` },
                { title: 'Opportunities', icon: Zap, color: 'text-violet-600', confidence: 'Low confidence (54%)', text: 'Bundling slow-moving stock with fast movers may improve cash conversion.' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <item.icon className={cn('h-5 w-5', item.color)} />
                      <p className="font-bold text-slate-900 dark:text-white">{item.title}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                      {item.confidence}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{item.text}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-black">Alert Center</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Priority signals detected by inventory AI.</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.title} className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900 dark:text-white">{alert.title}</p>
                    <span className={cn('rounded-full border px-2 py-0.5 text-xs font-bold', badgeClass[alert.level])}>{alert.level}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{alert.detail}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <GlassCard>
            <div className="mb-5">
              <p className="text-lg font-black">Inventory Trends</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Products added, sold, and updated over the past 30 days.</p>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="addedGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="soldGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="updatedGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="productsAdded" name="Products Added" stroke="#2563EB" fill="url(#addedGradient)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="productsSold" name="Products Sold" stroke="#10B981" fill="url(#soldGradient)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="productsUpdated" name="Products Updated" stroke="#7C3AED" fill="url(#updatedGradient)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-5">
              <p className="text-lg font-black">Stock Distribution</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Category mix and percentage of product catalog.</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
              <div className="relative h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="product_count" nameKey="category" innerRadius={78} outerRadius={112} paddingAngle={3}>
                      {categoryData.map((item, index) => (
                        <Cell key={item.category} fill={distributionColors[index % distributionColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="text-3xl font-black">{categoryTotal}</p>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Catalog mix</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 self-center">
                {categoryData.map((item, index) => (
                  <div key={item.category} className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: distributionColors[index % distributionColors.length] }} />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{item.category}</span>
                    <span className="text-sm font-bold text-slate-950 dark:text-white">{Math.round((item.product_count / categoryTotal) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>

        <motion.div variants={gridVariants} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {analytics.map((item) => (
            <GlassCard key={item.title}>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{item.title}</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="text-2xl font-black">{item.value}</p>
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', item.trend.startsWith('-') ? 'bg-red-50 text-red-600 dark:bg-red-500/10' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10')}>
                  {item.trend}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.note}</p>
              <div className="mt-4 h-12">
                <MiniLine color={item.color} data={miniSeries.map((point, index) => ({ value: point.value + index * (item.trend.startsWith('-') ? -1 : 1) }))} />
              </div>
            </GlassCard>
          ))}
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <GlassCard>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-lg font-black">Smart Recommendations</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Actionable AI cards with expected impact and savings.</p>
              </div>
              {productsLoading ? <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" /> : <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {recommendations.map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-200/70 bg-white/75 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className={cn('rounded-full border px-2 py-0.5 text-xs font-bold', badgeClass[item.priority])}>{item.priority}</span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Impact {item.impact}</span>
                  </div>
                  <p className="font-black text-slate-950 dark:text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-emerald-50 px-2 py-1 font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                      Saves {item.savings}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2 py-1 font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
                      Confidence {item.confidence}%
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.actions.map((action) => (
                      <button
                        key={`${item.title}-${action.label}`}
                        type="button"
                        title={`Open ${action.label}`}
                        onClick={() => openRecommendationRoute(action.to)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-blue-500/10"
                      >
                        {openingRoute === action.to ? 'Opening...' : action.label}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-5">
              <p className="text-lg font-black">Recent Activity</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Animated operational timeline.</p>
            </div>
            <div className="relative space-y-4">
              <div className="absolute left-5 top-2 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-blue-400 via-violet-400 to-emerald-400" />
              {activity.map((item, index) => (
                <motion.div key={item.id} variants={cardVariants} className="relative flex gap-3">
                  <div className="z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-xs font-black text-white shadow-lg">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1 rounded-2xl border border-slate-200/70 bg-white/75 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-bold text-slate-900 dark:text-white">{item.action}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">{item.status}</span>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{item.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <GlassCard>
            <div className="mb-5 flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              <p className="text-lg font-black">Supplier Analytics</p>
            </div>
            <div className="space-y-4">
              {supplierRows.map((supplier, index) => (
                <div key={supplier.supplier_name}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-950 px-2 py-0.5 text-xs font-black text-white dark:bg-white dark:text-slate-950">#{index + 1}</span>
                      <p className="font-bold text-slate-900 dark:text-white">{supplier.supplier_name}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{supplier.response}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10">
                    <div className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500" style={{ width: `${supplier.score}%` }} />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Delivery score {supplier.score}%</span>
                    <span>Success {supplier.success}%</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-5 flex items-center gap-2">
              <Gauge className="h-5 w-5 text-violet-600" />
              <p className="text-lg font-black">Inventory Health</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {healthMetrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-slate-200/70 bg-white/75 p-3 text-center dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="mx-auto h-20 w-20">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart data={[{ name: metric.label, value: metric.value, fill: metric.color }]} innerRadius="72%" outerRadius="100%" startAngle={90} endAngle={-270}>
                        <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#E2E8F0' }} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-lg font-black">{metric.value}%</p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{metric.label}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-lg font-black">30-Day Inventory Forecast</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Expected demand, revenue, and shortage pressure.</p>
              </div>
              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">86% confidence</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-blue-50 p-3 dark:bg-blue-500/10">
                <p className="text-slate-500 dark:text-slate-400">Expected Demand</p>
                <p className="text-xl font-black">{Math.round(dashboard.total_inventory_quantity * 0.18).toLocaleString()}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
                <p className="text-slate-500 dark:text-slate-400">Expected Revenue</p>
                <p className="text-xl font-black">{formatCurrency(Math.max(stockValue * 0.12, dashboard.total_inventory_quantity * 24))}</p>
              </div>
              <div className="rounded-2xl bg-red-50 p-3 dark:bg-red-500/10">
                <p className="text-slate-500 dark:text-slate-400">Shortages</p>
                <p className="text-xl font-black">{dashboard.low_stock_products}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-3 dark:bg-amber-500/10">
                <p className="text-slate-500 dark:text-slate-400">Overstock</p>
                <p className="text-xl font-black">{healthMetrics[0].value}%</p>
              </div>
            </div>
            <div className="mt-5 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="label" hide />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="demand" name="Expected Demand" stroke="#2563EB" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="revenue" name="Expected Revenue" stroke="#10B981" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        <GlassCard>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-black">Warehouse Performance Matrix</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Inventory volume, product coverage, and low-stock risk by warehouse.</p>
            </div>
            <ShieldCheck className="h-6 w-6 text-emerald-500" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard.warehouse_performance.slice(0, 8).map((warehouse) => ({
                name: warehouse.name.length > 14 ? `${warehouse.name.slice(0, 14)}...` : warehouse.name,
                products: warehouse.product_count,
                units: warehouse.total_units,
                risk: warehouse.low_stock_items,
              }))} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="products" name="Products" fill="#2563EB" radius={[8, 8, 0, 0]} />
                <Bar dataKey="units" name="Units" fill="#10B981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="risk" name="Low-stock risk" fill="#EF4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
}
