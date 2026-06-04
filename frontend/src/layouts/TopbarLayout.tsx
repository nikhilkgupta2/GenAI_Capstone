import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  BarChart3,
  BellRing,
  Boxes,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileDown,
  FileText,
  Megaphone,
  Menu,
  PackagePlus,
  PackageSearch,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Truck,
  Users,
  Warehouse,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/ui/Modal';
import { NotificationCenter } from '../components/notifications/NotificationCenter';
import { ThemeToggle } from '../components/ThemeToggle';
import { Badge } from '../components/ui/Badge';
import { toast } from '../components/ui/Toast';
import { cn } from '../lib/cn';
import { globalSearch } from '../lib/global-search';
import type { AuthUser, UserRole } from '../lib/auth-store';
import { ROLE_LABELS } from '../permissions/capabilities';
import { getRouteLabel } from '../navigation/appNavigation';

type TopbarLayoutProps = {
  user: AuthUser | null;
  onOpenMobile: () => void;
  onLogout: () => void;
};

type QuickActionItem = {
  label: string;
  to?: string;
  action?: 'announcement' | 'notification' | 'platform_report' | 'audit_report';
  icon: typeof Boxes;
  description: string;
};

const superAdminActions: QuickActionItem[] = [
  { label: 'Manage Tenants', to: '/tenants', icon: Users, description: 'Tenant lifecycle control center' },
  { label: 'Billing & Revenue', to: '/billing', icon: CreditCard, description: 'Subscription and plan revenue' },
  { label: 'Broadcast Announcement', action: 'announcement', icon: Megaphone, description: 'Draft a platform-wide message' },
  { label: 'Send Platform Notification', action: 'notification', icon: BellRing, description: 'Compose a platform alert' },
  { label: 'Platform Analytics', to: '/dashboard', icon: BarChart3, description: 'Platform overview dashboard' },
  { label: 'Generate Platform Report', action: 'platform_report', icon: FileDown, description: 'Download platform report draft' },
  { label: 'Platform Settings', to: '/settings', icon: Settings, description: 'System configuration' },
];

const retailerAdminActions: QuickActionItem[] = [
  { label: 'Add Product', to: '/products/new', icon: PackagePlus, description: 'Add a new SKU' },
  { label: 'Adjust Stock', to: '/inventory', icon: SlidersHorizontal, description: 'Move or adjust inventory' },
  { label: 'Manage Warehouses', to: '/warehouses', icon: Warehouse, description: 'Warehouse locations and stock' },
  { label: 'Manage Suppliers', to: '/suppliers', icon: Truck, description: 'Supplier profiles' },
  { label: 'Inventory Review', to: '/products', icon: ClipboardList, description: 'Review catalog and stock' },
  { label: 'Inventory Analytics', to: '/dashboard', icon: BarChart3, description: 'Operational dashboard' },
];

const inventoryManagerActions: QuickActionItem[] = [
  { label: 'Adjust Stock', to: '/inventory', icon: SlidersHorizontal, description: 'Move or adjust inventory' },
  { label: 'Manage Warehouses', to: '/warehouses', icon: Warehouse, description: 'Warehouse locations and stock' },
  { label: 'Inventory Review', to: '/products', icon: ClipboardList, description: 'Review catalog and stock' },
  { label: 'Inventory Analytics', to: '/dashboard', icon: BarChart3, description: 'Operational dashboard' },
];

const procurementManagerActions: QuickActionItem[] = [
  { label: 'Purchase Orders', to: '/purchase-orders', icon: ShoppingCart, description: 'Create, track, and receive orders' },
  { label: 'Manage Suppliers', to: '/suppliers', icon: Truck, description: 'Supplier profiles and contacts' },
  { label: 'Reorder Suggestions', to: '/dashboard', icon: PackageSearch, description: 'Restock recommendations' },
];

const auditorActions: QuickActionItem[] = [
  { label: 'View Audit Logs', to: '/audit-logs', icon: ShieldCheck, description: 'Compliance audit trail' },
  { label: 'Compliance Report', action: 'audit_report', icon: FileDown, description: 'Download audit report draft' },
  { label: 'Inventory Verification', to: '/products', icon: ClipboardList, description: 'Read-only inventory review' },
];

function getQuickActions(role?: UserRole | null): QuickActionItem[] {
  if (role === 'super_admin') return superAdminActions;
  if (role === 'retailer_admin') return retailerAdminActions;
  if (role === 'inventory_manager' || role === 'warehouse_staff') return inventoryManagerActions;
  if (role === 'procurement_manager') return procurementManagerActions;
  if (role === 'auditor') return auditorActions;
  return [];
}

export function TopbarLayout({ user, onOpenMobile, onLogout }: TopbarLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const route = getRouteLabel(location.pathname);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [quickActionModal, setQuickActionModal] = useState<'announcement' | 'notification' | null>(null);
  const [quickActionText, setQuickActionText] = useState('');
  const actionCenterRef = useRef<HTMLDivElement | null>(null);

  const isPro = (user?.current_plan === 'pro' || user?.current_plan === 'enterprise') && user?.subscription_status === 'active';
  const quickActions = getQuickActions(user?.role);
  const searchSuggestionsQuery = useQuery({
    queryKey: ['global-search', 'suggestions', user?.role, search.trim()],
    queryFn: () => globalSearch(search.trim(), user?.role, 3),
    enabled: search.trim().length >= 2 && searchFocused,
    staleTime: 15_000,
  });
  const suggestions = (searchSuggestionsQuery.data ?? []).slice(0, 6);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!actionCenterRef.current?.contains(event.target as Node)) {
        setActionsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActionsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleGlobalSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = search.trim();
    if (!value) {
      return;
    }
    setSearchFocused(false);
    navigate(`/search-results?q=${encodeURIComponent(value)}`);
  };

  const downloadQuickReport = (type: 'platform_report' | 'audit_report') => {
    const title = type === 'platform_report' ? 'Platform Report' : 'Audit Report';
    const body = [
      title,
      `Generated: ${new Date().toLocaleString()}`,
      `Prepared by: ${user?.name ?? 'System user'}`,
      '',
      type === 'platform_report'
        ? 'Summary: Platform tenant health, billing, system activity, and subscription metrics are ready for review.'
        : 'Summary: Audit logs, compliance activity, inventory verification, and user activity are ready for review.',
    ].join('\n');
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.push({ tone: 'success', title: `${title} generated`, description: 'A report draft has been downloaded.' });
  };

  const runQuickAction = (item: QuickActionItem) => {
    setActionsOpen(false);
    if (item.to) {
      navigate(item.to);
      return;
    }
    if (item.action === 'announcement' || item.action === 'notification') {
      setQuickActionText('');
      setQuickActionModal(item.action);
      return;
    }
    if (item.action === 'platform_report' || item.action === 'audit_report') {
      downloadQuickReport(item.action);
    }
  };

  const submitQuickMessage = () => {
    const isAnnouncement = quickActionModal === 'announcement';
    toast.push({
      tone: 'success',
      title: isAnnouncement ? 'Announcement drafted' : 'Notification drafted',
      description: quickActionText.trim() || 'Draft created for review.',
    });
    setQuickActionModal(null);
    setQuickActionText('');
  };


  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:px-5">
        <button
          className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50 md:hidden"
          onClick={onOpenMobile}
          type="button"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="hidden min-w-0 flex-col lg:flex">
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
            <span>{route.group}</span>
            <span>/</span>
            <span className="text-slate-700">{route.label}</span>
          </div>
          <p className="text-sm font-semibold text-slate-950">{route.label}</p>
        </div>

        <form className="relative hidden min-w-0 flex-1 sm:block lg:max-w-xl" onSubmit={handleGlobalSearch}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-medium text-slate-700 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(15,23,42,0.06)] sm:h-9"
            placeholder="Search products, stock, warehouses, orders..."
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setSearchFocused(true);
            }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => window.setTimeout(() => setSearchFocused(false), 160)}
          />
          {searchFocused && search.trim().length >= 2 ? (
            <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              {searchSuggestionsQuery.isLoading ? (
                <p className="px-4 py-3 text-sm text-slate-500">Searching...</p>
              ) : suggestions.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-500">No quick matches. Press Enter for full search.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {suggestions.map((item) => (
                    <button
                      key={`${item.category}-${item.id}-${item.href}`}
                      type="button"
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setSearchFocused(false);
                        navigate(item.href);
                      }}
                    >
                      <span className="mt-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {item.category}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-900">{item.title}</span>
                        <span className="block truncate text-xs text-slate-500">{item.subtitle}</span>
                      </span>
                    </button>
                  ))}
                  <button
                    type="submit"
                    className="block w-full px-4 py-2 text-left text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
                    onMouseDown={(event) => event.preventDefault()}
                  >
                    View all results for "{search.trim()}"
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </form>

        <div ref={actionCenterRef} className="relative hidden xl:block">
          <button
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            type="button"
            aria-haspopup="menu"
            aria-expanded={actionsOpen}
            onClick={() => setActionsOpen((value) => !value)}
          >
            <Zap className="h-4 w-4" />
            Actions
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', actionsOpen && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {actionsOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                role="menu"
                className="absolute right-0 top-12 z-50 w-[300px] overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 p-2 shadow-xl shadow-slate-900/15 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95"
              >
                <div className="grid gap-1">
                  {quickActions.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        role="menuitem"
                        onClick={() => runQuickAction(item)}
                        className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none dark:hover:bg-white/10 dark:focus:bg-white/10"
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition group-hover:scale-105 group-hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-slate-900 dark:text-white">{item.label}</span>
                          <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">{item.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <ThemeToggle />

        <NotificationCenter user={user} />

        <div className="hidden h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 xl:flex">
          <span className="max-w-[140px] truncate">{user?.tenant_id ? 'Retailer workspace' : 'Platform workspace'}</span>
        </div>

        <div className="group relative">
          <button
            className={cn(
              "flex h-10 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-left transition-all duration-300 hover:bg-slate-50",
              isPro && "border-black bg-emerald-50/10 shadow-[0_0_20px_-3px_rgba(0,0,0,0.15)] ring-1 ring-black dark:border-white dark:ring-white"
            )}
            type="button"
          >
            <span className={cn(
              "grid h-7 w-7 place-items-center rounded-md text-[12px] font-bold text-white transition-all duration-300",
              isPro ? "bg-slate-950 shadow-md shadow-black/20 group-hover:scale-105" : "bg-slate-900"
            )}>
              {user?.name?.slice(0, 1).toUpperCase() ?? 'I'}
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-[120px] truncate text-xs font-bold text-slate-900 dark:text-white">{user?.name ?? 'Inventory team'}</span>
              <span className="block max-w-[120px] truncate text-[11px] font-medium text-slate-500">
                {user ? ROLE_LABELS[user.role] : 'Workspace user'}
              </span>
            </span>
            {isPro && (
              <Badge
                tone="green"
                className="py-0 px-1.5 h-4 text-[10px] font-black border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm rounded-full ring-1 ring-emerald-100/50 ml-1 leading-none"
              >
                {user?.current_plan === 'enterprise' ? 'ENTERPRISE' : 'PRO'}
              </Badge>
            )}
            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
          </button>
          <div className="invisible absolute right-0 top-10 w-56 rounded-md border border-slate-200 bg-white p-2 opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
            <div className="border-b border-slate-100 px-2 py-2">
              <p className="truncate text-sm font-semibold text-slate-950">{user?.email ?? 'Signed in'}</p>
              <p className="text-xs text-slate-500">{user ? ROLE_LABELS[user.role] : 'Inventory workspace'}</p>
            </div>
            <button
              className="mt-1 w-full rounded-md px-2 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              type="button"
              onClick={() => navigate('/profile')}
            >
              Edit Profile
            </button>
            <button
              className="mt-1 w-full rounded-md px-2 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
              type="button"
              onClick={onLogout}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {quickActionModal ? (
        <Modal
          title={quickActionModal === 'announcement' ? 'Broadcast Announcement' : 'Send Platform Notification'}
          description={quickActionModal === 'announcement' ? 'Draft a platform-wide announcement for tenants.' : 'Draft a platform notification for operational users.'}
          onClose={() => setQuickActionModal(null)}
          className="max-w-lg"
        >
          <div className="space-y-4 p-5">
            <Input
              value={quickActionText}
              onChange={(event) => setQuickActionText(event.target.value)}
              placeholder={quickActionModal === 'announcement' ? 'Announcement message' : 'Notification message'}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="inline-flex h-10 items-center rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => setQuickActionModal(null)}
              >
                Cancel
              </button>
              <Button type="button" onClick={submitQuickMessage}>
                Save Draft
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}

    </header >
  );
}
