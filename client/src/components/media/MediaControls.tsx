'use client';

import { useVoiceStore } from '@/stores/voiceStore';
import { getSocket } from '@/lib/socket';
import { Mic, MicOff, Headphones, HeadphoneOff, Video, VideoOff, Monitor, PhoneOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaControlsProps {
  channelId: string;
  showVideo?: boolean;
  showScreenShare?: boolean;
  onToggleMute?: (muted: boolean) => void;
  onToggleVideo?: (enabled: boolean) => Promise<boolean | null | undefined>;
  onToggleScreenShare?: (enabled: boolean) => Promise<boolean | null | undefined>;
  onDisconnect?: () => void;
}

export default function MediaControls({
  channelId,
  showVideo = true,
  showScreenShare = true,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onDisconnect,
}: MediaControlsProps) {
  const { isMuted, isDeafened, isVideoOn, isScreenSharing, setMuted, setDeafened, setVideoOn, setScreenSharing } = useVoiceStore();
  const socket = getSocket();

  const toggleMute = () => {
    const newMuted = !isMuted;
    setMuted(newMuted);
    socket?.emit('voice:mute', { channelId, muted: newMuted });
    // Actually toggle the audio track
    onToggleMute?.(newMuted);
  };

  const toggleDeafen = () => {
    const newDeafened = !isDeafened;
    setDeafened(newDeafened);
    socket?.emit('voice:deafen', { channelId, deafened: newDeafened });
    // When deafening, also mute the mic
    if (newDeafened) {
      onToggleMute?.(true);
    } else if (!isMuted) {
      // When undeafening, unmute if wasn't manually muted
      onToggleMute?.(false);
    }
  };

  const toggleVideo = async () => {
    const newVideoOn = !isVideoOn;
    if (onToggleVideo) {
      await onToggleVideo(newVideoOn);
    }
    setVideoOn(newVideoOn);
  };

  const toggleScreenShare = async () => {
    const newScreenSharing = !isScreenSharing;
    if (onToggleScreenShare) {
      const success = await onToggleScreenShare(newScreenSharing);
      if (success !== false) {
        setScreenSharing(newScreenSharing);
      }
    } else {
      setScreenSharing(newScreenSharing);
    }
  };

  const disconnect = () => {
    if (onDisconnect) {
      onDisconnect();
    } else {
      socket?.emit('voice:leave', { channelId });
      useVoiceStore.getState().reset();
    }
  };

  return (
    <div className="flex items-center justify-center gap-3 p-4 bg-bg-tertiary/50 rounded-lg">
      <button
        onClick={toggleMute}
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
          isMuted ? 'bg-danger text-white' : 'bg-bg-active hover:bg-bg-hover text-text-primary'
        )}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
      </button>

      <button
        onClick={toggleDeafen}
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
          isDeafened ? 'bg-danger text-white' : 'bg-bg-active hover:bg-bg-hover text-text-primary'
        )}
        title={isDeafened ? 'Undeafen' : 'Deafen'}
      >
        {isDeafened ? <HeadphoneOff size={22} /> : <Headphones size={22} />}
      </button>

      {showVideo && (
        <button
          onClick={toggleVideo}
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
            isVideoOn ? 'bg-accent text-white' : 'bg-bg-active hover:bg-bg-hover text-text-primary'
          )}
          title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {isVideoOn ? <Video size={22} /> : <VideoOff size={22} />}
        </button>
      )}

      {showScreenShare && (
        <button
          onClick={toggleScreenShare}
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
            isScreenSharing ? 'bg-accent text-white' : 'bg-bg-active hover:bg-bg-hover text-text-primary'
          )}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          <Monitor size={22} />
        </button>
      )}

      <button
        onClick={disconnect}
        className="w-12 h-12 rounded-full bg-danger flex items-center justify-center text-white hover:bg-red-700 transition-colors"
        title="Disconnect"
      >
        <PhoneOff size={22} />
      </button>
    </div>
  );
}
