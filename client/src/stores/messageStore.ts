import { create } from 'zustand';
import api from '@/lib/api';
import type { Message } from '@/types';

interface MessageState {
  messages: Message[];
  hasMore: boolean;
  isLoading: boolean;
  activeChannelId: string | null;
  fetchMessages: (channelId: string) => Promise<void>;
  loadMore: (channelId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  removeMessage: (messageId: string) => void;
  setActiveChannel: (channelId: string | null) => void;
  clear: () => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],
  hasMore: true,
  isLoading: false,
  activeChannelId: null,

  fetchMessages: async (channelId) => {
    set({ isLoading: true, messages: [], hasMore: true, activeChannelId: channelId });
    try {
      const { data } = await api.get(`/channels/${channelId}/messages?limit=50`);
      set({ messages: data.messages, hasMore: data.hasMore, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  loadMore: async (channelId) => {
    const { messages, hasMore, isLoading } = get();
    if (!hasMore || isLoading || messages.length === 0) return;
    set({ isLoading: true });
    const cursor = messages[0].id;
    const { data } = await api.get(`/channels/${channelId}/messages?cursor=${cursor}&limit=50`);
    set((state) => ({
      messages: [...data.messages, ...state.messages],
      hasMore: data.hasMore,
      isLoading: false,
    }));
  },

  addMessage: (message) => {
    set((state) => {
      if (state.messages.some((m) => m.id === message.id)) return state;
      return { messages: [...state.messages, message] };
    });
  },

  updateMessage: (message) => {
    set((state) => ({
      messages: state.messages.map((m) => (m.id === message.id ? message : m)),
    }));
  },

  removeMessage: (messageId) => {
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    }));
  },

  setActiveChannel: (channelId) => set({ activeChannelId: channelId }),

  clear: () => set({ messages: [], hasMore: true, activeChannelId: null }),
}));
