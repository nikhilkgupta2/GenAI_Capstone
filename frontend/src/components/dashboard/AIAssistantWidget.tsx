import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import ReactMarkdown from 'react-markdown';
import { api } from '../../lib/api';
import { useDashboardStore, type ChatMessage } from '../../store/dashboardStore';
import { Bot, MessageCircle, SendHorizontal, X } from 'lucide-react';

const schema = z.object({
  message: z.string().min(1, 'Message is required'),
});

type FormValues = z.infer<typeof schema>;

interface ChatResponse {
  data?: {
    reply?: string;
  };
  reply?: string;
}

export function AIAssistantWidget() {
  const isChatOpen = useDashboardStore((state) => state.isChatOpen);
  const messages = useDashboardStore((state) => state.messages);
  const toggleChat = useDashboardStore((state) => state.toggleChat);
  const addMessage = useDashboardStore((state) => state.addMessage);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { message: '' },
  });

  async function onSubmit(values: FormValues) {
    const userMessage: ChatMessage = { role: 'user', content: values.message };
    addMessage(userMessage);
    reset();
    setLoading(true);

    try {
      const response = await api.post<ChatResponse>('/ai/chat', { message: values.message });
      const reply = response.data.data?.reply ?? response.data.reply ?? 'I could not retrieve a response. Please try again.';
      addMessage({ role: 'assistant', content: reply });
    } catch {
      addMessage({
        role: 'assistant',
        content: "Sorry, I couldn't reach the AI. Try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isChatOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="flex h-96 w-80 flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-blue-600">
                  <Bot className="h-5 w-5" />
                </div>
                <p className="font-semibold text-slate-950">Ask AI Assistant</p>
              </div>
              <button type="button" onClick={toggleChat} className="rounded-full p-2 text-slate-500 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex flex-1 flex-col space-y-2 overflow-y-auto p-3">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={
                      message.role === 'user'
                        ? 'self-end rounded-2xl rounded-br-sm bg-blue-600 px-3 py-2 text-sm text-white'
                        : 'self-start rounded-2xl rounded-bl-sm bg-gray-100 px-3 py-2 text-sm text-slate-800'
                    }
                  >
                    {message.role === 'assistant' ? <ReactMarkdown>{message.content}</ReactMarkdown> : message.content}
                  </div>
                ))}
                {loading ? (
                  <div className="flex items-center gap-2 self-start rounded-2xl rounded-bl-sm bg-gray-100 px-3 py-2">
                    {[0, 1, 2].map((dot) => (
                      <motion.span
                        key={dot}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: dot * 0.1 }}
                        className="h-2 w-2 rounded-full bg-slate-400"
                      />
                    ))}
                  </div>
                ) : null}
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="border-t border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <input
                    {...register('message')}
                    className="flex-1 rounded-2xl border border-gray-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Ask a question..."
                    disabled={isSubmitting}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || loading}
                    className="inline-flex h-10 items-center justify-center rounded-2xl bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <SendHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            type="button"
            onClick={toggleChat}
            className="grid h-14 w-14 place-items-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-500/20"
          >
            <MessageCircle className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
