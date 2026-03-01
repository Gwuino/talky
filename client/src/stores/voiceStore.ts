import { create } from 'zustand';
import type { VoicePeer } from '@/types';

interface VoiceState {
  connectedChannelId: string | null;
  peers: VoicePeer[];
  isMuted: boolean;
  isDeafened: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  localStream: MediaStream | null;
  setConnectedChannel: (channelId: string | null) => void;
  setPeers: (peers: VoicePeer[]) => void;
  addPeer: (peer: VoicePeer) => void;
  removePeer: (userId: string) => void;
  updatePeer: (userId: string, data: Partial<VoicePeer>) => void;
  setMuted: (muted: boolean) => void;
  setDeafened: (deafened: boolean) => void;
  setVideoOn: (on: boolean) => void;
  setScreenSharing: (sharing: boolean) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  reset: () => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  connectedChannelId: null,
  peers: [],
  isMuted: false,
  isDeafened: false,
  isVideoOn: false,
  isScreenSharing: false,
  localStream: null,

  setConnectedChannel: (channelId) => set({ connectedChannelId: channelId }),
  setPeers: (peers) => set({ peers }),
  addPeer: (peer) => set((s) => ({ peers: [...s.peers.filter((p) => p.userId !== peer.userId), peer] })),
  removePeer: (userId) => set((s) => ({ peers: s.peers.filter((p) => p.userId !== userId) })),
  updatePeer: (userId, data) =>
    set((s) => ({
      peers: s.peers.map((p) => (p.userId === userId ? { ...p, ...data } : p)),
    })),
  setMuted: (muted) => set({ isMuted: muted }),
  setDeafened: (deafened) => set((s) => ({ isDeafened: deafened, isMuted: deafened ? true : s.isMuted })),
  setVideoOn: (on) => set({ isVideoOn: on }),
  setScreenSharing: (sharing) => set({ isScreenSharing: sharing }),
  setLocalStream: (stream) => set({ localStream: stream }),
  reset: () =>
    set({
      connectedChannelId: null,
      peers: [],
      isMuted: false,
      isDeafened: false,
      isVideoOn: false,
      isScreenSharing: false,
      localStream: null,
    }),
}));
