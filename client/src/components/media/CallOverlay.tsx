'use client';

import { useRef, useEffect, useState } from 'react';
import { useCall } from '@/hooks/useCall';
import Avatar from '@/components/ui/Avatar';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Monitor, MonitorOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CallOverlay() {
  const {
    callState,
    incomingCall,
    localStream,
    remoteStream,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
  } = useCall();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    toggleMute(!newMuted); // toggleMute takes enabled, not muted
  };

  const handleToggleVideo = async () => {
    const newVideoOn = !isVideoOn;
    await toggleVideo(newVideoOn);
    setIsVideoOn(newVideoOn);
  };

  const handleToggleScreenShare = async () => {
    const newSharing = !isScreenSharing;
    const success = await toggleScreenShare(newSharing);
    if (success) setIsScreenSharing(newSharing);
  };

  // Incoming call notification
  if (callState === 'ringing' && incomingCall) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-bg-primary rounded-lg shadow-2xl border border-border p-4 w-72">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <Avatar name={incomingCall.callerName} size="md" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full animate-ping" />
          </div>
          <div>
            <p className="font-semibold text-text-primary">{incomingCall.callerName}</p>
            <p className="text-sm text-text-secondary">
              Incoming {incomingCall.type} call...
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={acceptCall}
            className="flex-1 py-2 rounded bg-success text-white flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
          >
            <Phone size={18} /> Accept
          </button>
          <button
            onClick={rejectCall}
            className="flex-1 py-2 rounded bg-danger text-white flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
          >
            <PhoneOff size={18} /> Decline
          </button>
        </div>
      </div>
    );
  }

  // Outgoing call (ringing)
  if (callState === 'outgoing') {
    return (
      <div className="fixed inset-0 z-50 bg-bg-tertiary/95 flex flex-col items-center justify-center">
        <Avatar name="Calling" size="lg" className="mb-4" />
        <p className="text-xl font-semibold text-text-primary mb-1">Calling...</p>
        <p className="text-text-secondary mb-8">Waiting for answer</p>
        <button
          onClick={endCall}
          className="w-14 h-14 rounded-full bg-danger text-white flex items-center justify-center hover:bg-red-700 transition-colors"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    );
  }

  // Active call with video/audio
  if (callState === 'active') {
    const hasRemoteVideo = remoteStream?.getVideoTracks().some((t) => t.enabled);
    const hasLocalVideo = localStream?.getVideoTracks().some((t) => t.enabled);

    return (
      <div className="fixed inset-0 z-50 bg-bg-tertiary flex flex-col">
        {/* Video area */}
        <div className="flex-1 relative flex items-center justify-center p-4">
          {/* Remote video (large) */}
          {hasRemoteVideo ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Avatar name="Call" size="lg" />
              <p className="text-text-primary text-lg">Connected</p>
            </div>
          )}

          {/* Local video (small, picture-in-picture) */}
          {hasLocalVideo && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-4 right-4 w-48 h-36 rounded-lg object-cover border-2 border-border bg-black"
            />
          )}

          {/* Remote audio only (hidden element) */}
          {!hasRemoteVideo && remoteStream && (
            <audio ref={remoteVideoRef as any} autoPlay playsInline />
          )}
        </div>

        {/* Controls bar */}
        <div className="flex items-center justify-center gap-3 p-6 bg-bg-primary/80 backdrop-blur-sm">
          <button
            onClick={handleToggleMute}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
              isMuted ? 'bg-danger text-white' : 'bg-bg-active hover:bg-bg-hover text-text-primary'
            )}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          <button
            onClick={handleToggleVideo}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
              isVideoOn ? 'bg-accent text-white' : 'bg-bg-active hover:bg-bg-hover text-text-primary'
            )}
            title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoOn ? <Video size={22} /> : <VideoOff size={22} />}
          </button>

          <button
            onClick={handleToggleScreenShare}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
              isScreenSharing ? 'bg-accent text-white' : 'bg-bg-active hover:bg-bg-hover text-text-primary'
            )}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            {isScreenSharing ? <MonitorOff size={22} /> : <Monitor size={22} />}
          </button>

          <button
            onClick={endCall}
            className="w-14 h-14 rounded-full bg-danger text-white flex items-center justify-center hover:bg-red-700 transition-colors"
            title="End call"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
