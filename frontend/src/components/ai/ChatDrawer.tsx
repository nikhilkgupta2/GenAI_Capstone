import { useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { Maximize2, Minimize2, Minus } from 'lucide-react';

import { streamChatMessage } from '../../lib/ai-api';
import type { AuthUser } from '../../lib/auth-store';
import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';
import type { ChatMessage } from './MessageBubble';
import { SuggestedPrompts } from './SuggestedPrompts';

const STORAGE_PREFIX = 'ims-ai-chat-sessions';
const LEGACY_STORAGE_PREFIX = 'ims-ai-chat-session';
const DRAWER_WIDTH_KEY = 'ims-ai-chat-drawer-width';
const DRAWER_HEIGHT_KEY = 'ims-ai-chat-drawer-height';
const DRAWER_POSITION_KEY = 'ims-ai-chat-drawer-position';
const DRAWER_MAXIMIZED_KEY = 'ims-ai-chat-drawer-maximized';
const DEFAULT_DRAWER_WIDTH = 420;
const DEFAULT_DRAWER_HEIGHT = 600;
const MIN_DRAWER_WIDTH = 360;
const MAX_DRAWER_WIDTH = 920;
const MIN_DRAWER_HEIGHT = 400;
const MAX_DRAWER_HEIGHT = 900;

export type ChatSessionSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
};

function newId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createEmptySession(): ChatSessionSummary {
  const now = new Date().toISOString();
  return { id: newId(), title: 'New chat', createdAt: now, updatedAt: now, messages: [] };
}

function titleFromMessage(message: string) {
  return message.length > 42 ? `${message.slice(0, 42)}...` : message;
}

export function ChatDrawer({ open, user, onClose }: { open: boolean; user: AuthUser; onClose: () => void }) {
  const location = useLocation();
  const storageKey = `${STORAGE_PREFIX}:${user.id}`;
  const activeStorageKey = `${storageKey}:active`;
  const legacyStorageKey = `${LEGACY_STORAGE_PREFIX}:${user.id}`;
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(() => {
    return localStorage.getItem(DRAWER_MAXIMIZED_KEY) === 'true';
  });
  const [drawerWidth, setDrawerWidth] = useState(() => {
    const saved = Number(localStorage.getItem(DRAWER_WIDTH_KEY));
    return Number.isFinite(saved) && saved >= MIN_DRAWER_WIDTH ? saved : DEFAULT_DRAWER_WIDTH;
  });
  const [drawerHeight, setDrawerHeight] = useState(() => {
    const saved = Number(localStorage.getItem(DRAWER_HEIGHT_KEY));
    return Number.isFinite(saved) && saved >= MIN_DRAWER_HEIGHT ? saved : DEFAULT_DRAWER_HEIGHT;
  });
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem(DRAWER_POSITION_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as { x: number; y: number };
      } catch {
        // Fall through
      }
    }
    return { x: window.innerWidth - DEFAULT_DRAWER_WIDTH - 20, y: 20 };
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const active = localStorage.getItem(activeStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatSessionSummary[];
        const validSessions = parsed.length ? parsed : [createEmptySession()];
        setSessions(validSessions);
        setActiveSessionId(active && validSessions.some((session) => session.id === active) ? active : validSessions[0].id);
        return;
      }

      const legacyRaw = localStorage.getItem(legacyStorageKey);
      if (legacyRaw) {
        const legacyMessages = JSON.parse(legacyRaw) as ChatMessage[];
        const migrated = createEmptySession();
        migrated.title = 'Previous chat';
        migrated.messages = legacyMessages;
        setSessions([migrated]);
        setActiveSessionId(migrated.id);
        return;
      }
    } catch {
      // Fall through to a clean chat if local storage is corrupted.
    }

    const empty = createEmptySession();
    setSessions([empty]);
    setActiveSessionId(empty.id);
  }, [activeStorageKey, legacyStorageKey, storageKey]);

  useEffect(() => {
    if (!sessions.length) return;
    localStorage.setItem(storageKey, JSON.stringify(sessions.map((session) => ({ ...session, messages: session.messages.slice(-40) }))));
  }, [sessions, storageKey]);

  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem(activeStorageKey, activeSessionId);
    }
  }, [activeSessionId, activeStorageKey]);


  useEffect(() => {
    localStorage.setItem(DRAWER_WIDTH_KEY, String(drawerWidth));
  }, [drawerWidth]);

  useEffect(() => {
    localStorage.setItem(DRAWER_HEIGHT_KEY, String(drawerHeight));
  }, [drawerHeight]);

  useEffect(() => {
    localStorage.setItem(DRAWER_POSITION_KEY, JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    localStorage.setItem(DRAWER_MAXIMIZED_KEY, String(isMaximized));
  }, [isMaximized]);

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isMaximized) return;
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const startPos = { ...position };

    const handleMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - drawerWidth, startPos.x + deltaX)),
        y: Math.max(0, Math.min(window.innerHeight - 60, startPos.y + deltaY)),
      });
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'move';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const startResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isMaximized) return;
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = drawerWidth;
    const startPosX = position.x;
    const maxWidth = Math.min(MAX_DRAWER_WIDTH, Math.max(MIN_DRAWER_WIDTH, window.innerWidth - 80));

    const handleMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const nextWidth = startWidth - deltaX;
      const clampedWidth = Math.min(maxWidth, Math.max(MIN_DRAWER_WIDTH, nextWidth));
      const widthDiff = startWidth - clampedWidth;
      setDrawerWidth(clampedWidth);
      setPosition(prev => ({ ...prev, x: Math.max(0, startPosX + widthDiff) }));
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const startResizeHeight = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isMaximized) return;
    event.preventDefault();
    event.stopPropagation();
    const startY = event.clientY;
    const startHeight = drawerHeight;
    const startPosY = position.y;
    const maxHeight = Math.min(MAX_DRAWER_HEIGHT, window.innerHeight - 80);

    const handleMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const nextHeight = startHeight - deltaY;
      const clampedHeight = Math.min(maxHeight, Math.max(MIN_DRAWER_HEIGHT, nextHeight));
      const heightDiff = startHeight - clampedHeight;
      setDrawerHeight(clampedHeight);
      setPosition(prev => ({ ...prev, y: Math.max(0, startPosY + heightDiff) }));
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const startResizeDiagonal = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isMaximized) return;
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = drawerWidth;
    const startHeight = drawerHeight;
    const startPosX = position.x;
    const startPosY = position.y;
    const maxWidth = Math.min(MAX_DRAWER_WIDTH, window.innerWidth - 80);
    const maxHeight = Math.min(MAX_DRAWER_HEIGHT, window.innerHeight - 80);

    const handleMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const nextWidth = startWidth - deltaX;
      const nextHeight = startHeight - deltaY;
      const clampedWidth = Math.min(maxWidth, Math.max(MIN_DRAWER_WIDTH, nextWidth));
      const clampedHeight = Math.min(maxHeight, Math.max(MIN_DRAWER_HEIGHT, nextHeight));
      const widthDiff = startWidth - clampedWidth;
      const heightDiff = startHeight - clampedHeight;
      setDrawerWidth(clampedWidth);
      setDrawerHeight(clampedHeight);
      setPosition({ 
        x: Math.max(0, startPosX + widthDiff), 
        y: Math.max(0, startPosY + heightDiff) 
      });
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'nwse-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const currentModule = useMemo(() => location.pathname, [location.pathname]);
  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? sessions[0];
  const messages = activeSession?.messages ?? [];

  const updateActiveSession = (updater: (session: ChatSessionSummary) => ChatSessionSummary) => {
    setSessions((current) => current.map((session) => (session.id === activeSessionId ? updater(session) : session)));
  };

  const deleteSession = (sessionId: string) => {
    const remaining = sessions.filter(s => s.id !== sessionId);
    if (remaining.length === 0) {
      const empty = createEmptySession();
      setSessions([empty]);
      setActiveSessionId(empty.id);
    } else {
      setSessions(remaining);
      if (activeSessionId === sessionId) {
        setActiveSessionId(remaining[0].id);
      }
    }
  };

  const startNewChat = () => {
    const next = createEmptySession();
    setSessions((current) => [next, ...current]);
    setActiveSessionId(next.id);
  };

  const send = async (content: string) => {
    if (!activeSessionId) return;
    const now = new Date().toISOString();
    const userMessage: ChatMessage = { id: newId(), role: 'user', content };
    const assistantId = newId();

    updateActiveSession((session) => ({
      ...session,
      title: session.messages.length === 0 ? titleFromMessage(content) : session.title,
      updatedAt: now,
      messages: [...session.messages, userMessage, { id: assistantId, role: 'assistant', content: '' }],
    }));
    setIsTyping(true);

    let assistantText = '';
    let sources: string[] = [];
    try {
      await streamChatMessage(
        content,
        currentModule,
        activeSessionId,
        (chunk) => {
          assistantText += chunk;
          updateActiveSession((session) => ({
            ...session,
            updatedAt: new Date().toISOString(),
            messages: session.messages.map((message) =>
              message.id === assistantId ? { ...message, content: assistantText, sources } : message,
            ),
          }));
        },
        (nextSources) => {
          sources = nextSources;
        },
      );
      updateActiveSession((session) => ({
        ...session,
        updatedAt: new Date().toISOString(),
        messages: session.messages.map((message) =>
          message.id === assistantId
            ? { ...message, content: assistantText || 'I could not generate a response right now.', sources }
            : message,
        ),
      }));
    } catch (error) {
      updateActiveSession((session) => ({
        ...session,
        updatedAt: new Date().toISOString(),
        messages: session.messages.map((message) =>
          message.id === assistantId
            ? { ...message, content: error instanceof Error ? error.message : 'AI assistant failed to respond.' }
            : message,
        ),
      }));
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {open && !isMinimized && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/10"
          onClick={onClose}
        />
      )}
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-lg transition hover:bg-slate-50 dark:border-white/10 dark:bg-[#242424] dark:hover:bg-[#2a2a2a]"
        >
          <span className="text-sm font-medium">AI Assistant</span>
          <Maximize2 className="h-4 w-4" />
        </button>
      ) : (
        <aside
          className={
            open
              ? 'fixed z-50 flex flex-col rounded-lg border border-slate-200 bg-slate-50 shadow-2xl transition-opacity dark:border-white/10 dark:bg-[#242424]'
              : 'pointer-events-none fixed z-50 flex flex-col rounded-lg border border-slate-200 bg-slate-50 opacity-0 shadow-2xl transition-opacity dark:border-white/10 dark:bg-[#242424]'
          }
          style={{
            left: isMaximized ? 0 : `${position.x}px`,
            top: isMaximized ? 0 : `${position.y}px`,
            width: isMaximized ? '100vw' : `${drawerWidth}px`,
            height: isMaximized ? '100vh' : `${drawerHeight}px`,
          }}
          aria-hidden={!open}
        >
          {/* Resize handles */}
          {!isMaximized && (
            <>
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize width"
                title="Drag to resize width"
                onPointerDown={startResize}
                className="absolute -left-1 top-0 h-full w-2 cursor-col-resize touch-none bg-transparent transition hover:bg-slate-300/60 dark:hover:bg-white/20"
              />
              <div
                role="separator"
                aria-orientation="horizontal"
                aria-label="Resize height"
                title="Drag to resize height"
                onPointerDown={startResizeHeight}
                className="absolute -top-1 left-0 h-2 w-full cursor-row-resize touch-none bg-transparent transition hover:bg-slate-300/60 dark:hover:bg-white/20"
              />
              <div
                role="separator"
                aria-label="Resize diagonally"
                title="Drag to resize both width and height"
                onPointerDown={startResizeDiagonal}
                className="absolute -left-1 -top-1 h-4 w-4 cursor-nwse-resize touch-none rounded-tl-lg bg-transparent transition hover:bg-slate-400/60 dark:hover:bg-white/30"
              />
            </>
          )}
          
          {/* Draggable header */}
          <div
            onPointerDown={startDrag}
            className="flex cursor-move items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#1a1a1a]"
          >
            <h2 className="text-sm font-semibold">AI Assistant</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(true);
                }}
                className="rounded p-1 transition hover:bg-slate-100 dark:hover:bg-white/10"
                title="Minimize"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMaximized(!isMaximized);
                }}
                className="rounded p-1 transition hover:bg-slate-100 dark:hover:bg-white/10"
                title={isMaximized ? 'Restore' : 'Maximize'}
              >
                {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="rounded p-1 transition hover:bg-slate-100 dark:hover:bg-white/10"
                title="Close"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <ChatHeader
            sessions={sessions.map(({ id, title, createdAt, updatedAt }) => ({ id, title, createdAt, updatedAt, messages: [] }))}
            activeSessionId={activeSessionId}
            onClose={onClose}
            onNewChat={startNewChat}
            onSelectSession={setActiveSessionId}
            onDeleteSession={deleteSession}
          />
          <SuggestedPrompts role={user.role} onSelect={send} hasMessages={messages.length > 0} />
          <MessageList messages={messages} isTyping={isTyping} />
          <ChatInput disabled={isTyping} onSend={send} />
        </aside>
      )}
    </>
  );
}
