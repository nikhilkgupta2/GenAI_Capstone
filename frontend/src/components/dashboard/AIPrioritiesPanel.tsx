import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface PriorityItem {
  id: number;
  product: string;
  desc: string;
  priority: 'High' | 'Medium' | 'Low';
  delay: string;
}

const priorities: PriorityItem[] = [
  { id: 1, product: 'Dell XPS 15', desc: 'Will stock out in 5 days', priority: 'High', delay: '4 days' },
  { id: 2, product: 'Purchase Order #4521', desc: 'Pending for 3 days', priority: 'Medium', delay: '3 days' },
  { id: 3, product: 'Warehouse B Inventory', desc: 'Increased 15% this week', priority: 'Low', delay: '1 day' },
];

const priorityStyles: Record<PriorityItem['priority'], { dot: string; badge: string }> = {
  High: { dot: 'bg-red-500 text-white', badge: 'bg-red-100 text-red-700' },
  Medium: { dot: 'bg-amber-500 text-white', badge: 'bg-amber-100 text-amber-700' },
  Low: { dot: 'bg-green-500 text-white', badge: 'bg-green-100 text-green-700' },
};

const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export function AIPrioritiesPanel() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-semibold text-slate-950">AI Priorities</h2>
        <button type="button" className="text-blue-500 text-sm font-semibold hover:text-blue-600">
          See All
        </button>
      </div>
      <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-3">
        {priorities.map((item) => (
          <motion.div
            key={item.id}
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={priorityStyles[item.priority].dot + ' grid h-9 w-9 shrink-0 place-items-center rounded-full'}>
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-950">{item.product}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
              <span className={priorityStyles[item.priority].badge + ' rounded-full px-2 py-0.5 text-xs font-semibold'}>
                {item.priority}
              </span>
            </div>
            <p className="mt-4 text-xs text-gray-400">Avg Delay: {item.delay}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
