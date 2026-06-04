import type { ReactNode } from 'react';

import { SectionCard, SectionHeader } from '../ui/Page';

export function SummaryCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <SectionCard>
      <SectionHeader title={title} description={description} />
      <div className="space-y-4 p-5 text-sm text-slate-600">{children}</div>
      {footer ? <div className="border-t border-slate-100 px-5 py-4">{footer}</div> : null}
    </SectionCard>
  );
}
