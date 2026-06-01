import { Send } from 'lucide-react';
import { type FormEvent, useRef, useState } from 'react';

export function ChatInput({ disabled, onSend }: { disabled: boolean; onSend: (message: string) => void }) {
  const [value, setValue] = useState('');
  const formRef = useRef<HTMLFormElement | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <form ref={formRef} onSubmit={submit} className="border-t border-slate-200 p-3 dark:border-white/10">
      <div className="flex items-end gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-black">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="Ask IMS Copilot..."
          className="min-h-[44px] flex-1 resize-none bg-transparent px-1 py-1 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-950 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
