interface ActionItem {
  id: number;
  action: string;
  priority: 'High' | 'Medium' | 'Low';
}

const actions: ActionItem[] = [
  { id: 1, action: 'Approve Stock Transfer #1218', priority: 'High' },
  { id: 2, action: 'Reorder Dell XPS 15 — 8 units', priority: 'High' },
  { id: 3, action: 'Review Supplier ABC contract', priority: 'Medium' },
  { id: 4, action: 'Restock Warehouse B — Zone 3', priority: 'Medium' },
  { id: 5, action: 'Update safety stock threshold', priority: 'Low' },
];

const badgeStyles: Record<ActionItem['priority'], string> = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-green-100 text-green-700',
};

export function RecommendedActions() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-950">Recommended Actions</h2>
        <button type="button" className="text-blue-500 text-sm font-semibold hover:text-blue-600">
          View All Actions →
        </button>
      </div>
      <div>
        {actions.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-center justify-between gap-3 border-b border-gray-50 px-3 py-2.5 ${
              index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'
            }`}
          >
            <p className="min-w-0 text-sm font-medium text-slate-950">{item.action}</p>
            <div className="flex shrink-0 items-center gap-2">
              <span className={badgeStyles[item.priority] + ' rounded-full px-2 py-0.5 text-xs font-semibold'}>
                {item.priority}
              </span>
              <button type="button" className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-gray-50">
                Act
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
