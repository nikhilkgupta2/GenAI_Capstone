import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '../Button';
import { cn } from '../../lib/cn';

export interface TableFooterProps {
  page: number;
  totalPages: number;
  itemSummary?: string;
  onPrevious: () => void;
  onNext: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  className?: string;
}

export function TableFooter({
  page,
  totalPages,
  itemSummary,
  onPrevious,
  onNext,
  previousDisabled,
  nextDisabled,
  className,
}: TableFooterProps) {
  return (
    <div data-pagination-footer className={cn('table-footer border-t border-slate-200 p-4', className)}>
      <div className="pagination-container flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
        <Button
          type="button"
          onClick={onPrevious}
          disabled={previousDisabled}
          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-slate-700 shadow-sm transition hover:bg-slate-50 focus:ring-blue-200 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15"
          aria-label="Go to previous page"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>

        <div className="page-info flex flex-col items-center text-center sm:flex-row sm:gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            Page {page} of {totalPages}
          </span>
          {itemSummary ? <span className="text-xs text-slate-500 dark:text-slate-400">{itemSummary}</span> : null}
        </div>

        <Button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-slate-700 shadow-sm transition hover:bg-slate-50 focus:ring-blue-200 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15"
          aria-label="Go to next page"
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
