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
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[82%] rounded-lg px-3 py-2 text-sm leading-6 shadow-sm',
          isUser
            ? 'bg-slate-950 text-white'
            : 'border border-slate-200 bg-white text-slate-800 dark:border-white/10 dark:bg-black dark:text-white',
        )}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
        {!isUser && message.sources?.length ? (
          <div className="mt-2 border-t border-slate-100 pt-1 text-[11px] text-slate-500 dark:border-white/10 dark:text-white/60">
            Sources: {message.sources.join(', ')}
          </div>
        ) : null}
      </div>
    </div>
  );
}
