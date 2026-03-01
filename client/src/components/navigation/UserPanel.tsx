'use client';

import { useAuthStore } from '@/stores/authStore';
import { useVoiceStore } from '@/stores/voiceStore';
import Avatar from '@/components/ui/Avatar';
import { Mic, MicOff, Headphones, HeadphoneOff, PhoneOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSocket } from '@/lib/socket';

export default function UserPanel() {
  const user = useAuthStore((s) => s.user);
  const { isMuted, isDeafened, connectedChannelId, setMuted, setDeafened, reset } = useVoiceStore();

  if (!user) return null;

  return (
    <div className="h-[52px] bg-bg-tertiary/50 flex items-center px-2 gap-2">
      <Avatar src={user.avatarUrl} name={user.displayName} size="sm" status="ONLINE" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{user.displayName}</p>
        <p className="text-xs text-text-muted truncate">{user.username}</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setMuted(!isMuted)}
          className={cn('p-1.5 rounded hover:bg-bg-hover', isMuted && 'text-danger')}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        <button
          onClick={() => setDeafened(!isDeafened)}
          className={cn('p-1.5 rounded hover:bg-bg-hover', isDeafened && 'text-danger')}
          title={isDeafened ? 'Undeafen' : 'Deafen'}
        >
          {isDeafened ? <HeadphoneOff size={18} /> : <Headphones size={18} />}
        </button>
        {connectedChannelId && (
          <button
            onClick={() => {
              const socket = getSocket();
              if (socket) {
                socket.emit('voice:leave', { channelId: connectedChannelId });
                reset();
              }
            }}
            className="p-1.5 rounded hover:bg-bg-hover text-danger hover:text-red-400"
            title="Disconnect from voice"
          >
            <PhoneOff size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
