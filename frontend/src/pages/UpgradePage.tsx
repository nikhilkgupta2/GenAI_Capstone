import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Barcode,
  Calendar,
  Crown,
  FileDown,
  LineChart,
  PackageSearch,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Warehouse,
} from 'lucide-react';

import { useAuthStore } from '../lib/auth-store';

import { Button } from '../components/Button';
import { Page } from '../components/ui/Page';
import { toast } from '../components/ui/Toast';
import { cn } from '../lib/cn';
import { createRazorpayOrder, type PlanCode, verifyRazorpayPayment, getPlans } from '../lib/subscription-api';
import { loadRazorpayCheckout } from '../lib/razorpay';
import { LoadingState } from '../components/ui/LoadingState';

type PlanCard = {
  code: 'free' | PlanCode;
  title: string;
  subtitle: string;
  priceLabel: string;
  bullets: string[];
  highlighted?: boolean;
  badge?: string;
  cta: string;
};

const featureCards = [
  { title: 'Smart Stock Summary', icon: Sparkles, description: 'Instant signals on stock movement, velocity, and inventory health.' },
  { title: 'Most Demanded Products', icon: PackageSearch, description: 'Identify high-velocity SKUs and prioritize replenishment.' },
  { title: 'AI Analytics Dashboard', icon: BarChart3, description: 'Premium dashboards designed for retailer decision-making.' },
  { title: 'Warehouse Insights', icon: Warehouse, description: 'Operational visibility across multi-warehouse footprints.' },
  { title: 'Barcode Scanner Access', icon: ScanLine, description: 'Fast SKU lookup workflows for modern inventory teams.' },
  { title: 'Advanced Audit Logs', icon: ShieldCheck, description: 'Detailed operational traceability across key modules.' },
  { title: 'Demand Prediction', icon: LineChart, description: 'Forward-looking signals that reduce stock-outs and overstock.' },
  { title: 'Export Reports', icon: FileDown, description: 'Export-ready reports built for finance and operations reviews.' },
] as const;

export function UpgradePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [activeCheckoutPlan, setActiveCheckoutPlan] = useState<PlanCode | null>(null);

  const expiryDate = useMemo(() => {
    if (!user?.subscription_start_date) return null;
    const date = new Date(user.subscription_start_date);
    date.setMonth(date.getMonth() + 1);
    return date;
  }, [user?.subscription_start_date]);

  const { data: apiPlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['subscriptions', 'plans'],
    queryFn: getPlans,
  });

  const plans: PlanCard[] = useMemo(() => {
    const basePlans: PlanCard[] = [
      {
        code: 'free',
        title: 'Free Trial',
        subtitle: 'For small teams starting their inventory system.',
        priceLabel: '$0 / month',
        bullets: ['Max 5 active users', '2 warehouses maximum', 'Up to 100 catalog SKUs', 'Analytics disabled'],
        cta: 'Current Plan',
      },
    ];

    const dynamicCards: PlanCard[] = apiPlans.map((p) => {
      const bullets = [
        `Max ${p.max_users === -1 ? 'Unlimited' : p.max_users} active users`,
        `${p.max_warehouses === -1 ? 'Unlimited' : p.max_warehouses} warehouses maximum`,
        `Up to ${p.max_products === -1 ? 'Unlimited' : p.max_products.toLocaleString()} catalog SKUs`,
      ];

      if (p.feature_analytics) bullets.push('Analytics enabled');
      if (p.plan_code === 'enterprise') bullets.push('AI forecasting');
      else if (p.feature_analytics) bullets.push('AI insights enabled');

      if (p.feature_barcode) bullets.push('Barcode enabled');
      if (p.feature_audit_logs) bullets.push('Audit logs enabled');
      if (p.feature_procurement) bullets.push('Procurement enabled');

      return {
        code: p.plan_code as PlanCode,
        title: p.name,
        subtitle: p.description || (p.plan_code === 'pro' ? 'For retailers operating multi-warehouse configurations.' : 'For global logistics chains with high throughput.'),
        priceLabel: `$${p.price} / month`,
        bullets,
        highlighted: p.plan_code === 'pro',
        badge: p.plan_code === 'pro' ? 'Most Popular' : undefined,
        cta: p.plan_code === 'pro' ? 'Upgrade' : 'Buy Now',
      };
    });

    return [...basePlans, ...dynamicCards];
  }, [apiPlans]);

  const currentPlanPrice = useMemo(() => {
    if (!user?.current_plan) return null;
    if (user.current_plan === 'free') return '$0';
    const plan = apiPlans.find(p => p.plan_code === user.current_plan);
    return plan ? `$${plan.price}` : (user.current_plan === 'pro' ? '$99' : '$499');
  }, [user?.current_plan, apiPlans]);

  async function startCheckout(planCode: PlanCode) {
    try {
      setActiveCheckoutPlan(planCode);
      await loadRazorpayCheckout();
      const order = await createRazorpayOrder(planCode);

      if (!window.Razorpay) {
        throw new Error('Razorpay checkout is unavailable.');
      }

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'IMS Pro',
        description: planCode === 'pro' ? 'Professional plan subscription' : 'Enterprise plan subscription',
        order_id: order.order_id,
        theme: { color: '#4f46e5' },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          document.documentElement.classList.remove('razorpay-opened');
          await verifyRazorpayPayment({
            plan_code: planCode,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          toast.push({
            tone: 'success',
            title: 'Upgrade successful',
            description: 'Your subscription is active. Redirecting to dashboard…',
          });
          navigate('/dashboard', { replace: true });
        },
        modal: {
          ondismiss: () => {
            document.documentElement.classList.remove('razorpay-opened');
            setActiveCheckoutPlan(null);
          },
          backdrop_color: 'rgba(0,0,0,0.65)',
          handle_back: false,
          escape: true,
        },
      });

      document.documentElement.classList.add('razorpay-opened');
      rzp.open();
    } catch (error) {
      document.documentElement.classList.remove('razorpay-opened');
      const message = error instanceof Error ? error.message : 'Upgrade could not be started.';
      toast.push({ tone: 'error', title: 'Payment failed', description: message });
      setActiveCheckoutPlan(null);
    }
  }
  if (plansLoading) {
    return (
      <Page>
        <LoadingState label="Fetching latest pricing plans..." />
      </Page>
    );
  }

  return (
    <Page className="space-y-10 pb-10">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 px-6 py-10 shadow-sm dark:border-white/10 dark:bg-black dark:shadow-black/40 sm:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.1),rgba(0,0,0,0))] dark:bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.35),rgba(0,0,0,0))]" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-white/80">
            <Crown className="h-4 w-4 text-indigo-500 dark:text-indigo-300" />
            Premium upgrade
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            Unlock Pro Inventory Intelligence
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-white/70">
            Advanced stock analytics, most demanded product insights, AI inventory summaries, warehouse intelligence, and predictive analytics —
            all in one premium workspace.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => startCheckout('pro')} disabled={activeCheckoutPlan !== null} className="sm:w-auto">
              {activeCheckoutPlan === 'pro' ? 'Opening checkout…' : 'Get Pro'}
            </Button>
            <button
              type="button"
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/85 dark:hover:bg-white/10"
            >
              View pricing
            </button>
          </div>
        </div>
      </section>

      {user?.current_plan && user.current_plan !== 'free' && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6 dark:border-emerald-500/20 dark:bg-emerald-500/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Current active plan</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                    {user.current_plan === 'pro' ? 'Professional' : 'Enterprise'} Plan
                  </h3>
                  <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                    Paid: {currentPlanPrice}
                  </span>
                </div>
                {user.subscription_start_date && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-white/50">
                    Purchased on: <span className="font-medium text-slate-700 dark:text-white/80">{new Date(user.subscription_start_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                  </p>
                )}
              </div>
            </div>
            {expiryDate && (
              <div className="flex items-center gap-2 rounded-lg bg-white/60 px-4 py-2 text-sm dark:bg-white/5">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span className="text-slate-600 dark:text-white/70">
                  Renews/Expires on: <span className="font-semibold text-slate-900 dark:text-white">{expiryDate.toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-white/50">Features</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Everything you need to run inventory like a pro</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-white/65">Premium-grade tooling with modern UX, hover interactions, and role-aware workflows.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featureCards.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={cn(
                  'group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition',
                  'hover:-translate-y-0.5 hover:border-indigo-500/40 hover:shadow-indigo-500/10 dark:border-white/10 dark:bg-black/60 dark:hover:bg-black/70',
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-indigo-600 transition group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10 dark:border-white/10 dark:bg-white/5 dark:text-indigo-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  {feature.title === 'Barcode Scanner Access' ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                      <Barcode className="h-3 w-3" />
                      Pro
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">{feature.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-white/65">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="pricing" className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-white/50">Pricing</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Choose the plan that fits your team</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-white/65">Upgrade instantly. Your plan updates as soon as payment is verified.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <section
              key={plan.code}
              className={cn(
                'relative flex flex-col overflow-hidden rounded-2xl border bg-white p-6 shadow-sm dark:bg-black/60',
                plan.highlighted ? 'border-indigo-600 shadow-indigo-600/5 dark:border-indigo-500/40 dark:shadow-indigo-500/10' : 'border-slate-200 dark:border-white/10',
              )}
            >
              {plan.badge ? (
                <div className="absolute right-0 top-0 bg-indigo-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  {plan.badge}
                </div>
              ) : null}

              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                {plan.code.toUpperCase()} Pack
              </span>
              <h3 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{plan.title}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-white/65">{plan.subtitle}</p>

              <div className="my-5 border-t border-slate-100 pt-5 dark:border-white/10">
                <p className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">{plan.priceLabel.split(' / ')[0]}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-white/60">/ month</p>
              </div>

              <ul className="flex-grow space-y-2.5 text-sm text-slate-600 dark:text-white/70">
                {plan.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <span className="mt-0.5 text-indigo-600 dark:text-white/70">✓</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {plan.code === 'free' ? (
                  <Button disabled className="w-full dark:!bg-white dark:!text-slate-950">
                    {user?.current_plan === 'free' || !user?.current_plan ? 'Current Plan' : 'Free Tier'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => startCheckout(plan.code as PlanCode)}
                    disabled={
                      activeCheckoutPlan !== null ||
                      user?.current_plan === plan.code ||
                      (user?.current_plan === 'enterprise' && plan.code === 'pro')
                    }
                    className={cn(
                      'w-full dark:!bg-white dark:!text-slate-950 dark:hover:!bg-slate-100',
                      plan.highlighted && 'shadow-[0_0_0_1px_rgba(99,102,241,0.35),0_18px_40px_-18px_rgba(99,102,241,0.55)]',
                    )}
                  >
                    {activeCheckoutPlan === plan.code
                      ? 'Opening checkout…'
                      : user?.current_plan === plan.code
                        ? 'Current Plan'
                        : (user?.current_plan === 'enterprise' && plan.code === 'pro')
                          ? 'Plan Not Available'
                          : plan.cta}
                  </Button>
                )}
              </div>
            </section>
          ))}
        </div>
      </section>
    </Page>
  );
}
