'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useWebRTC } from './useWebRTC';

export type CallState = 'idle' | 'ringing' | 'outgoing' | 'active';

interface IncomingCall {
  callId: string;
  callerId: string;
  callerName: string;
  type: 'audio' | 'video';
}

export function useCall() {
  const [callState, setCallState] = useState<CallState>('idle');
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const handleRemoteStream = useCallback((_userId: string, stream: MediaStream) => {
    setRemoteStream(stream);
  }, []);

  const handleRemoteStreamRemoved = useCallback(() => {
    setRemoteStream(null);
  }, []);

  const { connectToPeer, startMedia, stopMedia, toggleAudio, toggleVideo, startScreenShare, stopScreenShare, disconnectAll, localStreamRef } = useWebRTC({
    onRemoteStream: handleRemoteStream,
    onRemoteStreamRemoved: handleRemoteStreamRemoved,
  });

  // Listen for call events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleIncoming = ({ callId, callerId, callerName, type }: IncomingCall) => {
      setIncomingCall({ callId, callerId, callerName, type });
      setCallState('ringing');
    };

    const handleRinging = ({ callId }: { callId: string }) => {
      setActiveCallId(callId);
      setCallState('outgoing');
    };

    const handleAccepted = ({ callId }: { callId: string }) => {
      setActiveCallId(callId);
      setCallState('active');
    };

    const handleRejected = () => {
      stopMedia();
      disconnectAll();
      setCallState('idle');
      setActiveCallId(null);
      setRemoteUserId(null);
    };

    const handleEnded = () => {
      stopMedia();
      disconnectAll();
      setCallState('idle');
      setActiveCallId(null);
      setIncomingCall(null);
      setRemoteStream(null);
      setRemoteUserId(null);
      screenStreamRef.current = null;
    };

    socket.on('call:incoming', handleIncoming);
    socket.on('call:ringing', handleRinging);
    socket.on('call:accepted', handleAccepted);
    socket.on('call:rejected', handleRejected);
    socket.on('call:ended', handleEnded);

    return () => {
      socket.off('call:incoming', handleIncoming);
      socket.off('call:ringing', handleRinging);
      socket.off('call:accepted', handleAccepted);
      socket.off('call:rejected', handleRejected);
      socket.off('call:ended', handleEnded);
    };
  }, [stopMedia, disconnectAll]);

  // Initiate a call
  const initiateCall = useCallback(async (targetUserId: string, type: 'audio' | 'video') => {
    const socket = getSocket();
    if (!socket) return;

    const stream = await startMedia({ audio: true, video: type === 'video' });
    if (!stream) return;

    setRemoteUserId(targetUserId);
    socket.emit('call:initiate', { targetUserId, type });
  }, [startMedia]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    const socket = getSocket();
    if (!socket || !incomingCall) return;

    const stream = await startMedia({ audio: true, video: incomingCall.type === 'video' });
    if (!stream) return;

    setActiveCallId(incomingCall.callId);
    setRemoteUserId(incomingCall.callerId);
    setCallState('active');

    socket.emit('call:accept', { callId: incomingCall.callId });

    // Connect to the caller's peer
    await connectToPeer(incomingCall.callerId, incomingCall.callerName);
    setIncomingCall(null);
  }, [incomingCall, startMedia, connectToPeer]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    const socket = getSocket();
    if (!socket || !incomingCall) return;

    socket.emit('call:reject', { callId: incomingCall.callId });
    setIncomingCall(null);
    setCallState('idle');
  }, [incomingCall]);

  // End active call
  const endCall = useCallback(() => {
    const socket = getSocket();
    if (!socket || !activeCallId) return;

    socket.emit('call:end', { callId: activeCallId });
    stopMedia();
    disconnectAll();
    stopScreenShare(screenStreamRef.current);
    screenStreamRef.current = null;
    setCallState('idle');
    setActiveCallId(null);
    setIncomingCall(null);
    setRemoteStream(null);
    setRemoteUserId(null);
  }, [activeCallId, stopMedia, disconnectAll, stopScreenShare]);

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
    callState,
    activeCallId,
    incomingCall,
    localStream: localStreamRef.current,
    remoteStream,
    remoteUserId,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute: toggleAudio,
    toggleVideo: handleToggleVideo,
    toggleScreenShare: handleToggleScreenShare,
  };
}
