import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';

import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { Page, PageHeader, SectionCard, SectionHeader } from '../components/ui/Page';
import { useAuthStore } from '../lib/auth-store';
import { globalSearch, type GlobalSearchResult } from '../lib/global-search';

function groupResults(results: GlobalSearchResult[]) {
  return results.reduce<Record<string, GlobalSearchResult[]>>((groups, result) => {
    groups[result.category] = [...(groups[result.category] ?? []), result];
    return groups;
  }, {});
}

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const query = searchParams.get('q')?.trim() ?? '';

  const searchQuery = useQuery({
    queryKey: ['global-search', 'results', user?.role, query],
    queryFn: () => globalSearch(query, user?.role, 12),
    enabled: query.length > 0,
  });

  const grouped = useMemo(() => groupResults(searchQuery.data ?? []), [searchQuery.data]);
  const categories = Object.entries(grouped);
  const total = searchQuery.data?.length ?? 0;

  return (
    <Page>
      <PageHeader
        eyebrow="Workspace Search"
        title="Search Results"
        description={query ? `Showing accessible matches for "${query}".` : 'Enter a keyword in the global search bar to find workspace records.'}
      />

      {!query ? (
        <SectionCard className="p-6">
          <EmptyState title="No search keyword" description="Use the global search bar to search products, inventory, warehouses, orders, suppliers, approvals, and audit records." />
        </SectionCard>
      ) : searchQuery.isLoading ? (
        <SectionCard className="p-6">
          <LoadingState label="Searching workspace..." />
        </SectionCard>
      ) : total === 0 ? (
        <SectionCard className="p-6">
          <EmptyState title="No matching results" description="Try another product name, SKU, supplier, warehouse, order number, status, or activity keyword." />
        </SectionCard>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
            {total} accessible result{total === 1 ? '' : 's'} found
          </div>
          {categories.map(([category, items]) => (
            <SectionCard key={category}>
              <SectionHeader title={category} description={`${items.length} match${items.length === 1 ? '' : 'es'}`} />
              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <Link
                    key={`${item.category}-${item.id}-${item.href}`}
                    to={item.href}
                    className="flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50"
                  >
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                      <Search className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-900">{item.title}</span>
                      <span className="mt-0.5 block text-sm text-slate-600">{item.subtitle}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </Page>
  );
}
