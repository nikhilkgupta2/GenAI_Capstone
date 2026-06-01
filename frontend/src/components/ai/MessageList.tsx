import { useEffect, useRef } from 'react';

import { MessageBubble, type ChatMessage } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

export function MessageList({ messages, isTyping }: { messages: ChatMessage[]; isTyping: boolean }) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
      {messages.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-white/60">
          Ask about stock, purchase orders, warehouse inventory, approvals, or audit activity.
        </div>
      ) : null}
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isTyping ? <TypingIndicator /> : null}
      <div ref={endRef} />
    </div>
  );
}
