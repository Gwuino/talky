'use client';

import { useVoiceStore } from '@/stores/voiceStore';
import { useServerStore } from '@/stores/serverStore';
import { PhoneOff, Signal } from 'lucide-react';
import { getSocket } from '@/lib/socket';

export default function VoiceStatusBar() {
  const { connectedChannelId, localStream, reset } = useVoiceStore();
  const channels = useServerStore((s) => s.channels);
  const channel = channels.find((c) => c.id === connectedChannelId);

  if (!connectedChannelId) return null;

  const handleDisconnect = () => {
    const socket = getSocket();
    if (socket) {
      socket.emit('voice:leave', { channelId: connectedChannelId });
    }
    // Stop local media tracks
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    reset();
  };

  return (
    <div className="bg-[#232428] border-t border-border/30 px-3 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Signal size={16} className="text-success" />
          <div>
            <p className="text-xs font-medium text-success">Voice Connected</p>
            <p className="text-[11px] text-text-muted truncate">{channel?.name || 'Voice Channel'}</p>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          className="p-1.5 rounded hover:bg-bg-hover text-text-secondary hover:text-danger"
          title="Disconnect"
        >
          <PhoneOff size={18} />
        </button>
      </div>
    </div>
  );
}
