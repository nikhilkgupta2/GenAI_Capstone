import { Sparkles } from 'lucide-react';

export function FloatingChatButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="group fixed bottom-5 right-5 z-40">
      <div className="pointer-events-none absolute bottom-14 right-0 whitespace-nowrap rounded-md bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:translate-y-[-2px] group-hover:opacity-100 dark:bg-white dark:text-slate-950">
        Ask AI
      </div>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
        aria-label="Ask AI"
        title="Ask AI"
      >
        <Sparkles className="h-5 w-5" />
      </button>
    </div>
  );
}
