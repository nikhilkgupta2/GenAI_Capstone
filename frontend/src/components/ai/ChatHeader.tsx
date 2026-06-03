import { MessageSquarePlus, Trash2 } from 'lucide-react';
import { useDialog } from '../../context/DialogContext';

import type { ChatSessionSummary } from './ChatDrawer';

export function ChatHeader({
  sessions,
  activeSessionId,
  onClose,
  onNewChat,
  onSelectSession,
  onDeleteSession,
}: {
  sessions: ChatSessionSummary[];
  activeSessionId: string;
  onClose: () => void;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}) {
  const dialog = useDialog();

  const handleDelete = async () => {
    const confirmed = await dialog.confirm({
      title: 'Delete Conversation',
      description: 'Are you sure you want to permanently remove this chat history? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Keep',
      tone: 'danger',
    });

    if (confirmed) {
      onDeleteSession(activeSessionId);
    }
  };

  return (
    <div className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500 dark:text-white/60">Role-aware inventory copilot</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onNewChat}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            New
          </button>
          {sessions.length > 1 && (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-red-200 px-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
              title="Delete conversation"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      {sessions.length > 1 ? (
        <select
          value={activeSessionId}
          onChange={(event) => onSelectSession(event.target.value)}
          className="mt-3 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none dark:border-white/10 dark:bg-black dark:text-white"
        >
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.title}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
