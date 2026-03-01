import { create } from 'zustand';
import api from '@/lib/api';
import type { Friendship } from '@/types';

interface FriendState {
  friends: Friendship[];
  incomingRequests: Friendship[];
  outgoingRequests: Friendship[];
  isLoading: boolean;
  fetchFriends: () => Promise<void>;
  fetchRequests: () => Promise<void>;
  sendRequest: (targetUserId: string) => Promise<void>;
  acceptRequest: (friendshipId: string) => Promise<void>;
  declineRequest: (friendshipId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
  addIncomingRequest: (friendship: Friendship) => void;
  onRequestAccepted: (friendship: Friendship) => void;
  onFriendRemoved: (friendshipId: string) => void;
}

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
  isLoading: false,

  fetchFriends: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/friends');
      set({ friends: data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchRequests: async () => {
    try {
      const { data } = await api.get('/friends/requests');
      set({ incomingRequests: data.incoming, outgoingRequests: data.outgoing });
    } catch {}
  },

  sendRequest: async (targetUserId) => {
    const { data } = await api.post('/friends/request', { targetUserId });
    set((s) => ({ outgoingRequests: [data, ...s.outgoingRequests] }));
  },

  acceptRequest: async (friendshipId) => {
    const { data } = await api.post(`/friends/accept/${friendshipId}`);
    set((s) => ({
      incomingRequests: s.incomingRequests.filter((r) => r.id !== friendshipId),
      friends: [{ ...data, friend: data.sender }, ...s.friends],
    }));
  },

  declineRequest: async (friendshipId) => {
    await api.post(`/friends/decline/${friendshipId}`);
    set((s) => ({
      incomingRequests: s.incomingRequests.filter((r) => r.id !== friendshipId),
    }));
  },

  removeFriend: async (friendshipId) => {
    await api.delete(`/friends/${friendshipId}`);
    set((s) => ({
      friends: s.friends.filter((f) => f.id !== friendshipId),
    }));
  },

  addIncomingRequest: (friendship) => {
    set((s) => {
      if (s.incomingRequests.some((r) => r.id === friendship.id)) return s;
      return { incomingRequests: [friendship, ...s.incomingRequests] };
    });
  },

  onRequestAccepted: (friendship) => {
    set((s) => ({
      outgoingRequests: s.outgoingRequests.filter((r) => r.id !== friendship.id),
      friends: s.friends.some((f) => f.id === friendship.id)
        ? s.friends
        : [{ ...friendship, friend: friendship.receiver }, ...s.friends],
    }));
  },

  onFriendRemoved: (friendshipId) => {
    set((s) => ({
      friends: s.friends.filter((f) => f.id !== friendshipId),
    }));
  },
}));
