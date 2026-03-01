'use client';

import { Hash, Volume2, Users, Phone } from 'lucide-react';
import type { Channel } from '@/types';

interface ChatHeaderProps {
  channel?: Channel;
  title?: string;
  subtitle?: string;
  showMembers?: boolean;
  onToggleMembers?: () => void;
  onCall?: () => void;
}

export default function ChatHeader({ channel, title, subtitle, showMembers, onToggleMembers, onCall }: ChatHeaderProps) {
  const Icon = channel?.type === 'VOICE' ? Volume2 : Hash;
  const displayTitle = title || channel?.name || '';

  return (
    <div className="h-12 min-h-[48px] flex items-center px-4 border-b border-border/50 shadow-sm bg-bg-primary">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {channel && <Icon size={20} className="text-text-muted shrink-0" />}
        <h3 className="font-semibold text-text-primary truncate">{displayTitle}</h3>
        {subtitle && <span className="text-sm text-text-muted hidden sm:block">| {subtitle}</span>}
      </div>
      <div className="flex items-center gap-2">
        {onCall && (
          <button onClick={onCall} className="p-1.5 rounded hover:bg-bg-hover text-text-secondary hover:text-text-primary">
            <Phone size={20} />
          </button>
        )}
        {onToggleMembers && (
          <button
            onClick={onToggleMembers}
            className={`p-1.5 rounded hover:bg-bg-hover ${showMembers ? 'text-text-primary' : 'text-text-secondary'}`}
          >
            <Users size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
