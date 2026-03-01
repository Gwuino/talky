import { create } from 'zustand';
import api from '@/lib/api';
import type { Server, Channel, ServerMember } from '@/types';

interface ServerState {
  servers: Server[];
  activeServer: Server | null;
  channels: Channel[];
  members: ServerMember[];
  isLoading: boolean;
  fetchServers: () => Promise<void>;
  fetchServer: (serverId: string) => Promise<void>;
  createServer: (name: string) => Promise<Server>;
  joinServer: (inviteCode: string) => Promise<Server>;
  setActiveServer: (server: Server | null) => void;
  createChannel: (serverId: string, name: string, type: 'TEXT' | 'VOICE') => Promise<Channel>;
}

export const useServerStore = create<ServerState>((set, get) => ({
  servers: [],
  activeServer: null,
  channels: [],
  members: [],
  isLoading: false,

  fetchServers: async () => {
    const { data } = await api.get('/servers/my');
    set({ servers: data });
  },

  fetchServer: async (serverId) => {
    set({ isLoading: true });
    const { data } = await api.get(`/servers/${serverId}`);
    set({
      activeServer: data,
      channels: data.channels || [],
      members: data.members || [],
      isLoading: false,
    });
  },

  createServer: async (name) => {
    const { data } = await api.post('/servers', { name });
    set((state) => ({ servers: [...state.servers, data as Server] }));
    return data;
  },

  joinServer: async (inviteCode) => {
    const { data } = await api.post('/servers/join', { inviteCode });
    set((state) => ({ servers: [...state.servers, data as Server] }));
    return data;
  },

  setActiveServer: (server) => set({ activeServer: server }),

  createChannel: async (serverId, name, type) => {
    const { data } = await api.post(`/servers/${serverId}/channels`, { name, type });
    set((state) => ({ channels: [...state.channels, data] }));
    return data;
  },
}));
