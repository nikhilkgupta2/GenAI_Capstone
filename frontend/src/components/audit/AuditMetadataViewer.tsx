import { useState } from 'react';

import { auditMetadataLines } from './audit-utils';

export function AuditMetadataViewer({
  title,
  value,
}: {
  title: string;
  value?: Record<string, unknown> | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const lines = auditMetadataLines(value);
  const hasValue = lines.length > 0;
  const visibleLines = expanded ? lines : lines.slice(0, 6);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{title}</p>
        {hasValue ? (
          <button
            type="button"
            className="text-xs font-semibold text-slate-700 underline-offset-2 hover:underline"
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? 'Show less' : 'Show all'}
          </button>
        ) : null}
      </div>
      {hasValue ? (
        <div className={`space-y-2 overflow-auto p-3 text-sm leading-5 text-slate-700 ${expanded ? 'max-h-96' : 'max-h-56'}`}>
          {visibleLines.map((item) => (
            <div key={item.label} className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{item.label}</p>
              <p className="mt-1 break-words font-medium text-slate-800">{item.value}</p>
            </div>
          ))}
          {!expanded && lines.length > visibleLines.length ? (
            <p className="text-xs font-medium text-slate-500">{lines.length - visibleLines.length} more detail{lines.length - visibleLines.length === 1 ? '' : 's'} hidden.</p>
          ) : null}
        </div>
      ) : (
        <p className="p-3 text-sm text-slate-500">No metadata captured.</p>
      )}
    </div>
  );
}
