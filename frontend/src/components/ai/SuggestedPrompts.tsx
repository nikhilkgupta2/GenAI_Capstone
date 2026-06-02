import type { UserRole } from '../../lib/auth-store';

const PROMPTS: Record<UserRole, string[]> = {
  retailer_admin: [
    'Show low stock products and recommend actions',
    'Show pending approvals with risk priority',
    'Give me an inventory summary with operational risks',
    'Analyze supplier performance and purchase order exposure',
    'Explain what I can do on this page as Retailer Admin',
  ],
  inventory_manager: [
    'Give reorder suggestions from current inventory',
    'Identify slow moving or risky inventory areas',
    'Summarize recent stock movements and exceptions',
    'Show warehouse stock that needs attention',
    'Explain the inventory workflow step by step',
  ],
  warehouse_staff: [
    'Find SKU status in my assigned warehouse',
    'Show my warehouse inventory needing action',
    'List transfer tasks or warehouse stock issues',
    'What should I do for receiving today?',
    'Explain my allowed warehouse actions',
  ],
  procurement_manager: [
    'Show pending purchase orders and next actions',
    'Analyze supplier delays and replenishment risks',
    'Recommend replenishment actions from inventory visibility',
    'Summarize supplier performance',
    'Explain procurement workflow in this portal',
  ],
  auditor: [
    'Show recent adjustments with audit context',
    'Summarize approval history and compliance risks',
    'Give an audit summary for inventory activity',
    'Explain what evidence I can inspect as Auditor',
    'List anomalies I should review next',
  ],
  super_admin: [
    'Explain tenant analytics and what to monitor',
    'Summarize system health checks I should review',
    'Explain billing and subscription controls',
    'What platform risks should I inspect today?',
    'Explain all Super Admin modules and workflows',
  ],
};

export function SuggestedPrompts({ role, onSelect, hasMessages }: { role: UserRole; onSelect: (prompt: string) => void; hasMessages: boolean }) {
  if (hasMessages) return null;
  
  return (
    <div className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Suggested Actions</p>
      <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto pr-1">
        {PROMPTS[role].map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelect(prompt)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-black dark:text-white dark:hover:bg-white/10"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
