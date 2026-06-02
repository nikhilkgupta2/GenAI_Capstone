import { useEffect, useMemo, useState } from 'react';

import { cn } from '../../lib/cn';

type ToastTone = 'success' | 'error' | 'info';

export type ToastMessage = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  createdAt: number;
};

type Subscriber = (messages: ToastMessage[]) => void;

const subscribers = new Set<Subscriber>();
let messages: ToastMessage[] = [];

function emit() {
  for (const subscriber of subscribers) subscriber(messages);
}

export const toast = {
  push(input: Omit<ToastMessage, 'id' | 'createdAt'>) {
    const id = crypto.randomUUID();
    const createdAt = Date.now();
    messages = [{ id, createdAt, ...input }, ...messages].slice(0, 3);
    emit();
    window.setTimeout(() => {
      messages = messages.filter((m) => m.id !== id);
      emit();
    }, 3500);
  },
};

const toneClass: Record<ToastTone, string> = {
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-50',
  error: 'border-red-500/20 bg-red-500/10 text-red-50',
  info: 'border-sky-500/20 bg-sky-500/10 text-sky-50',
};

export function ToastViewport() {
  const [items, setItems] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const subscriber: Subscriber = (next) => setItems(next);
    subscribers.add(subscriber);
    subscriber(messages);
    return () => {
      subscribers.delete(subscriber);
    };
  }, []);

  const rendered = useMemo(
    () =>
      items.map((item) => (
        <div
          key={item.id}
          className={cn(
            'pointer-events-auto w-[min(420px,calc(100vw-2rem))] rounded-lg border px-4 py-3 shadow-lg backdrop-blur',
            'dark:shadow-black/30',
            toneClass[item.tone],
          )}
        >
          <p className="text-sm font-semibold">{item.title}</p>
          {item.description ? <p className="mt-0.5 text-xs text-white/80">{item.description}</p> : null}
        </div>
      )),
    [items],
  );

  if (rendered.length === 0) return null;

  return <div className="pointer-events-none fixed right-4 top-4 z-[70] flex flex-col gap-2">{rendered}</div>;
}

