interface SupplierHealthItem {
  id: number;
  name: string;
  initials: string;
  risk: 'High' | 'Medium' | 'Low';
  lead: string;
  health: number;
}

const suppliers: SupplierHealthItem[] = [
  { id: 1, name: 'ABC Supplier', initials: 'AB', risk: 'High', lead: '1.2 days', health: 30 },
  { id: 2, name: 'Dell Inc', initials: 'DL', risk: 'Medium', lead: '2.1 days', health: 60 },
  { id: 3, name: 'XYZ Supplies', initials: 'XY', risk: 'Low', lead: '0.8 days', health: 85 },
  { id: 4, name: 'Global Traders', initials: 'GT', risk: 'Medium', lead: '3.5 days', health: 55 },
];

const riskStyles: Record<SupplierHealthItem['risk'], { avatar: string; badge: string; bar: string }> = {
  High: { avatar: 'bg-red-100 text-red-700', badge: 'bg-red-100 text-red-700', bar: 'bg-red-500' },
  Medium: { avatar: 'bg-amber-100 text-amber-700', badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500' },
  Low: { avatar: 'bg-green-100 text-green-700', badge: 'bg-green-100 text-green-700', bar: 'bg-green-500' },
};

export function SupplierHealthPanel() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-semibold text-slate-950">Supplier Health</h2>
        <button type="button" className="text-blue-500 text-sm font-semibold hover:text-blue-600">
          See All
        </button>
      </div>

      <div className="space-y-4">
        {suppliers.map((item) => (
          <div key={item.id}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={riskStyles[item.risk].avatar + ' grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold'}>
                  {item.initials}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-950">{item.name}</p>
                  <p className="text-xs text-gray-400">Lead time: {item.lead}</p>
                </div>
              </div>
              <span className={riskStyles[item.risk].badge + ' rounded-full px-2 py-0.5 text-xs font-semibold'}>
                {item.risk}
              </span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div className={riskStyles[item.risk].bar + ' h-1.5 rounded-full'} style={{ width: `${item.health}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
