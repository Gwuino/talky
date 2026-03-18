'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useVoiceStore } from '@/stores/voiceStore';
import { getSocket } from '@/lib/socket';
import { useWebRTC } from './useWebRTC';

export function useVoice(channelId: string) {
  const { setConnectedChannel, addPeer, removePeer, setLocalStream, reset } = useVoiceStore();
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const screenStreamRef = useRef<MediaStream | null>(null);
  const listenersRef = useRef<{ cleanup: () => void } | null>(null);

  const handleRemoteStream = useCallback((userId: string, stream: MediaStream) => {
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      next.set(userId, stream);
      return next;
    });
  }, []);

  const handleRemoteStreamRemoved = useCallback((userId: string) => {
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      next.delete(userId);
      return next;
    });
  }, []);

  const { connectToPeer, startMedia, stopMedia, toggleAudio, toggleVideo, startScreenShare, stopScreenShare, disconnectAll, localStreamRef } = useWebRTC({
    channelId,
    onRemoteStream: handleRemoteStream,
    onRemoteStreamRemoved: handleRemoteStreamRemoved,
  });

  const cleanupListeners = useCallback(() => {
    if (listenersRef.current) {
      listenersRef.current.cleanup();
      listenersRef.current = null;
    }
  }, []);

  const joinVoice = useCallback(async () => {
    const socket = getSocket();
    if (!socket) return;

    // Get microphone audio
    const stream = await startMedia({ audio: true });
    if (!stream) return;

    setLocalStream(stream);
    setConnectedChannel(channelId);

    // Join the voice channel on server
    socket.emit('voice:join', { channelId });

    // Clean up any existing listeners before attaching new ones
    cleanupListeners();

    const handleParticipants = ({ participants }: { participants: { userId: string; username: string }[] }) => {
      participants.forEach((p) => {
        connectToPeer(p.userId, p.username);
      });
    };

    const handleUserJoined = ({ userId, username }: { userId: string; username: string }) => {
      addPeer({ userId, username, muted: false, deafened: false });
    };

    const handleUserLeft = ({ userId }: { userId: string }) => {
      removePeer(userId);
      handleRemoteStreamRemoved(userId);
    };

    socket.on('voice:participants', handleParticipants);
    socket.on('voice:user-joined', handleUserJoined);
    socket.on('voice:user-left', handleUserLeft);

    listenersRef.current = {
      cleanup: () => {
        socket.off('voice:participants', handleParticipants);
        socket.off('voice:user-joined', handleUserJoined);
        socket.off('voice:user-left', handleUserLeft);
      },
    };
  }, [channelId, startMedia, setLocalStream, setConnectedChannel, connectToPeer, addPeer, removePeer, handleRemoteStreamRemoved, cleanupListeners]);

  const leaveVoice = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('voice:leave', { channelId });
    cleanupListeners();
    disconnectAll();
    stopScreenShare(screenStreamRef.current);
    screenStreamRef.current = null;
    setRemoteStreams(new Map());
    reset();
  }, [channelId, disconnectAll, stopScreenShare, reset, cleanupListeners]);

  // Clean up listeners on unmount
  useEffect(() => {
    return () => {
      cleanupListeners();
    };
  }, [cleanupListeners]);

  const handleToggleMute = useCallback((muted: boolean) => {
    toggleAudio(!muted); // toggleAudio expects enabled, not muted
  }, [toggleAudio]);

  const handleToggleVideo = useCallback(async (enabled: boolean) => {
    await toggleVideo(enabled);
  }, [toggleVideo]);

  const handleToggleScreenShare = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const stream = await startScreenShare();
      screenStreamRef.current = stream;
      return !!stream;
    } else {
      stopScreenShare(screenStreamRef.current);
      screenStreamRef.current = null;
      return true;
    }
  }, [startScreenShare, stopScreenShare]);

  return {
    localStream: localStreamRef.current,
    remoteStreams,
    joinVoice,
    leaveVoice,
    toggleMute: handleToggleMute,
    toggleVideo: handleToggleVideo,
    toggleScreenShare: handleToggleScreenShare,
  };
}
