import { Bot, Info } from 'lucide-react';

interface AIBriefItem {
  id: number;
  insight: string;
}

const insights: AIBriefItem[] = [
  { id: 1, insight: '5 products are at risk of stockout in the next 7 days' },
  { id: 2, insight: 'Electronics demand increased by 15% this month' },
  { id: 3, insight: '2 suppliers are showing approval delays' },
  { id: 4, insight: 'Reorder value this week is estimated at ₹4,821' },
  { id: 5, insight: 'Inventory health improved by 1% since last week' },
];

export function AIDailyBrief() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 border-l-4 border-blue-500">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-600">
          <Bot className="h-5 w-5" />
        </span>
        <h2 className="font-semibold text-slate-950">AI Daily Brief</h2>
      </div>
      <div className="space-y-3">
        {insights.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <Info className="mt-1 h-4 w-4 text-blue-400" />
            <p className="text-sm text-gray-600">{item.insight}</p>
          </div>
        ))}
      </div>
      <button type="button" className="mt-5 text-blue-500 text-sm font-semibold hover:text-blue-600">
        View Full Brief →
      </button>
    </div>
  );
}
