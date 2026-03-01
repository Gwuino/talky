import { create } from 'zustand';
import api from '@/lib/api';
import type { DMConversation, DirectMessage } from '@/types';

interface DMState {
  conversations: DMConversation[];
  activeConversation: DMConversation | null;
  messages: DirectMessage[];
  hasMore: boolean;
  isLoading: boolean;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  loadMore: (conversationId: string) => Promise<void>;
  addMessage: (message: DirectMessage) => void;
  createConversation: (targetUserId: string) => Promise<DMConversation>;
  setActiveConversation: (conversation: DMConversation | null) => void;
}

export const useDMStore = create<DMState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  hasMore: true,
  isLoading: false,

  fetchConversations: async () => {
    const { data } = await api.get('/dm/conversations');
    set({ conversations: data });
  },

  fetchMessages: async (conversationId) => {
    set({ isLoading: true, messages: [], hasMore: true });
    const { data } = await api.get(`/dm/conversations/${conversationId}/messages?limit=50`);
    set({ messages: data.messages, hasMore: data.hasMore, isLoading: false });
  },

  loadMore: async (conversationId) => {
    const { messages, hasMore, isLoading } = get();
    if (!hasMore || isLoading || messages.length === 0) return;
    set({ isLoading: true });
    const cursor = messages[0].id;
    const { data } = await api.get(`/dm/conversations/${conversationId}/messages?cursor=${cursor}&limit=50`);
    set((s) => ({
      messages: [...data.messages, ...s.messages],
      hasMore: data.hasMore,
      isLoading: false,
    }));
  },

  addMessage: (message) => {
    set((s) => {
      if (s.messages.some((m) => m.id === message.id)) return s;
      return { messages: [...s.messages, message] };
    });
  },

  createConversation: async (targetUserId) => {
    const { data } = await api.post('/dm/conversations', { targetUserId });
    set((s) => {
      const exists = s.conversations.some((c) => c.id === data.id);
      return exists ? s : { conversations: [data, ...s.conversations] };
    });
    return data;
  },

  setActiveConversation: (conversation) => set({ activeConversation: conversation }),
}));
