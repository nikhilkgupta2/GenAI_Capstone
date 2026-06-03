import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/cn';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
};

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex group animate-in fade-in slide-in-from-bottom-2 duration-300', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-md transition-all duration-200 hover:shadow-lg',
          isUser
            ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white dark:from-white dark:to-slate-200 dark:text-black rounded-tr-none border border-white/5'
            : 'bg-white text-slate-800 dark:bg-zinc-900 dark:text-zinc-100 dark:border-white/10 border border-slate-100 rounded-tl-none ring-1 ring-slate-100 dark:ring-white/5',
        )}
      >
        <div className={cn(
          "prose prose-sm max-w-none prose-headings:mb-2 prose-headings:mt-1 prose-p:my-1 prose-ul:my-1 prose-li:my-0.5",
          isUser ? "prose-invert" : "dark:prose-invert prose-slate"
        )}>
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="leading-6">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-4 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1">{children}</ol>,
              code: ({ children }) => <code className="bg-slate-100 dark:bg-white/10 px-1 rounded text-xs font-mono">{children}</code>,
              pre: ({ children }) => <pre className="bg-slate-900 text-slate-100 p-2 rounded-lg my-2 overflow-x-auto text-xs">{children}</pre>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {!isUser && message.sources?.length ? (
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-white/5">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-zinc-500 mb-1.5 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
              Verified Sources
            </p>
            <div className="flex flex-wrap gap-1.5">
              {message.sources.map((source, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 rounded text-[10px] text-slate-600 dark:text-zinc-400 font-medium"
                >
                  {source}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
