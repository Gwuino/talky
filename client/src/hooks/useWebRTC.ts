'use client';

import { useRef, useCallback, useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useSettingsStore } from '@/stores/settingsStore';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    ...(process.env.NEXT_PUBLIC_TURN_URL
      ? [
          {
            urls: process.env.NEXT_PUBLIC_TURN_URL,
            username: process.env.NEXT_PUBLIC_TURN_USERNAME || '',
            credential: process.env.NEXT_PUBLIC_TURN_PASSWORD || '',
          },
        ]
      : []),
  ],
};

interface PeerConnection {
  pc: RTCPeerConnection;
  userId: string;
  username: string;
}

interface UseWebRTCOptions {
  channelId?: string;
  onRemoteStream?: (userId: string, stream: MediaStream) => void;
  onRemoteStreamRemoved?: (userId: string) => void;
}

export function useWebRTC({ channelId, onRemoteStream, onRemoteStreamRemoved }: UseWebRTCOptions = {}) {
  const peersRef = useRef<Map<string, PeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  const createPeerConnection = useCallback((targetUserId: string, targetUsername: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    const socket = getSocket();

    // Add local tracks to the connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Send ICE candidates to remote peer
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('rtc:ice-candidate', {
          targetUserId,
          candidate: event.candidate.toJSON(),
          channelId,
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream && onRemoteStream) {
        onRemoteStream(targetUserId, stream);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        onRemoteStreamRemoved?.(targetUserId);
      }
    };

    peersRef.current.set(targetUserId, { pc, userId: targetUserId, username: targetUsername });
    return pc;
  }, [channelId, onRemoteStream, onRemoteStreamRemoved]);

  // Initiate a connection to a remote peer (caller side)
  const connectToPeer = useCallback(async (targetUserId: string, targetUsername: string) => {
    const socket = getSocket();
    if (!socket) return;

    const pc = createPeerConnection(targetUserId, targetUsername);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit('rtc:offer', {
      targetUserId,
      offer: pc.localDescription,
      channelId,
    });
  }, [createPeerConnection, channelId]);

  // Handle incoming signaling events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleOffer = async ({ userId, username, offer, channelId: ch }: { userId: string; username: string; offer: RTCSessionDescriptionInit; channelId?: string }) => {
      // Only handle offers for our channel (or no channel = DM call)
      if (channelId && ch && ch !== channelId) return;

      const pc = createPeerConnection(userId, username);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('rtc:answer', {
        targetUserId: userId,
        answer: pc.localDescription,
        channelId,
      });
    };

    const handleAnswer = async ({ userId, answer }: { userId: string; answer: RTCSessionDescriptionInit }) => {
      const peer = peersRef.current.get(userId);
      if (peer) {
        await peer.pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleIceCandidate = async ({ userId, candidate }: { userId: string; candidate: RTCIceCandidateInit }) => {
      const peer = peersRef.current.get(userId);
      if (peer) {
        await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    socket.on('rtc:offer', handleOffer);
    socket.on('rtc:answer', handleAnswer);
    socket.on('rtc:ice-candidate', handleIceCandidate);

    return () => {
      socket.off('rtc:offer', handleOffer);
      socket.off('rtc:answer', handleAnswer);
      socket.off('rtc:ice-candidate', handleIceCandidate);
    };
  }, [channelId, createPeerConnection]);

  // Get user media (microphone, optionally camera)
  const startMedia = useCallback(async (options: { audio?: boolean; video?: boolean } = { audio: true }) => {
    try {
      const { audioInputId, videoInputId } = useSettingsStore.getState();

      const constraints: MediaStreamConstraints = {
        audio: options.audio !== false
          ? (audioInputId ? { deviceId: { exact: audioInputId } } : true)
          : false,
        video: options.video
          ? (videoInputId ? { deviceId: { exact: videoInputId } } : true)
          : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      // Add tracks to all existing peer connections
      peersRef.current.forEach(({ pc }) => {
        stream.getTracks().forEach((track) => {
          const senders = pc.getSenders();
          const existingSender = senders.find((s) => s.track?.kind === track.kind);
          if (existingSender) {
            existingSender.replaceTrack(track);
          } else {
            pc.addTrack(track, stream);
          }
        });
      });

      return stream;
    } catch (err) {
      console.error('Failed to get user media:', err);
      return null;
    }
  }, []);

  // Stop all media tracks
  const stopMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
  }, []);

  // Toggle audio track
  const toggleAudio = useCallback((enabled: boolean) => {
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }, []);

  // Toggle video track
  const toggleVideo = useCallback(async (enabled: boolean) => {
    if (enabled) {
      try {
        const { videoInputId } = useSettingsStore.getState();
        const videoConstraints = videoInputId ? { deviceId: { exact: videoInputId } } : true;
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
        const videoTrack = videoStream.getVideoTracks()[0];

        // Add video track to local stream
        if (localStreamRef.current) {
          localStreamRef.current.addTrack(videoTrack);
        }

        // Add to all peer connections
        peersRef.current.forEach(({ pc }) => {
          pc.addTrack(videoTrack, localStreamRef.current!);
        });

        return videoTrack;
      } catch (err) {
        console.error('Failed to get camera:', err);
        return null;
      }
    } else {
      // Remove video tracks
      localStreamRef.current?.getVideoTracks().forEach((track) => {
        track.stop();
        localStreamRef.current?.removeTrack(track);
        peersRef.current.forEach(({ pc }) => {
          const sender = pc.getSenders().find((s) => s.track === track);
          if (sender) pc.removeTrack(sender);
        });
      });
      return null;
    }
  }, []);

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const screenTrack = screenStream.getVideoTracks()[0];

      // Add screen share track to all peer connections
      peersRef.current.forEach(({ pc }) => {
        pc.addTrack(screenTrack, screenStream);
      });

      screenTrack.onended = () => {
        // Clean up when user stops sharing via browser UI
        peersRef.current.forEach(({ pc }) => {
          const sender = pc.getSenders().find((s) => s.track === screenTrack);
          if (sender) pc.removeTrack(sender);
        });
      };

      return screenStream;
    } catch (err) {
      console.error('Failed to start screen share:', err);
      return null;
    }
  }, []);

  // Stop screen sharing
  const stopScreenShare = useCallback((stream: MediaStream | null) => {
    if (!stream) return;
    stream.getTracks().forEach((track) => {
      track.stop();
      peersRef.current.forEach(({ pc }) => {
        const sender = pc.getSenders().find((s) => s.track === track);
        if (sender) pc.removeTrack(sender);
      });
    });
  }, []);

  // Disconnect from a specific peer
  const disconnectPeer = useCallback((userId: string) => {
    const peer = peersRef.current.get(userId);
    if (peer) {
      peer.pc.close();
      peersRef.current.delete(userId);
      onRemoteStreamRemoved?.(userId);
    }
  }, [onRemoteStreamRemoved]);

  // Disconnect from all peers and stop media
  const disconnectAll = useCallback(() => {
    peersRef.current.forEach(({ pc }) => pc.close());
    peersRef.current.clear();
    stopMedia();
  }, [stopMedia]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      peersRef.current.forEach(({ pc }) => pc.close());
      peersRef.current.clear();
    };
  }, []);

  return {
    localStreamRef,
    peersRef,
    connectToPeer,
    startMedia,
    stopMedia,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    disconnectPeer,
    disconnectAll,
  };
}
