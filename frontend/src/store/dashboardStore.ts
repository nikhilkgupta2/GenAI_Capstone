import { create } from 'zustand';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

interface DashboardStore {
  isChatOpen: boolean;
  messages: ChatMessage[];
  toggleChat: () => void;
  addMessage: (message: ChatMessage) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  isChatOpen: false,
  messages: [
    {
      role: 'assistant',
      content: "Hi there! I'm your AI dashboard assistant. Ask me anything about inventory or recommendations.",
    },
  ],
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
}));
