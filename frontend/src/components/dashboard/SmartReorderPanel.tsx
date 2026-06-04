import { Package } from 'lucide-react';

interface RecommendationItem {
  id: number;
  name: string;
  units: number;
  priority: 'High' | 'Medium' | 'Low';
}

const recommendations: RecommendationItem[] = [
  { id: 1, name: 'Dell XPS 15', units: 8, priority: 'High' },
  { id: 2, name: 'Logitech MX Keys', units: 12, priority: 'Medium' },
  { id: 3, name: 'Anker 65W Charger', units: 20, priority: 'Low' },
];

const badgeStyles: Record<RecommendationItem['priority'], string> = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-green-100 text-green-700',
};

export function SmartReorderPanel() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-semibold text-slate-950">Smart Reorder Recommendations</h2>
        <button type="button" className="text-blue-500 text-sm font-semibold hover:text-blue-600">
          See All
        </button>
      </div>
      <div className="space-y-3">
        {recommendations.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-gray-100 text-slate-600">
                <Package className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-slate-950">{item.name}</p>
                <p className="text-sm text-gray-500">Suggested: {item.units} units</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={badgeStyles[item.priority] + ' rounded-full px-2 py-0.5 text-xs font-semibold'}>{item.priority}</span>
              <button type="button" className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-gray-50">
                Approve
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
