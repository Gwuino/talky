'use client';

import Avatar from '@/components/ui/Avatar';
import { format } from 'date-fns';

interface MessageItemProps {
  id: string;
  content: string;
  createdAt: string;
  editedAt?: string | null;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  showHeader?: boolean;
}

export default function MessageItem({ content, createdAt, editedAt, user, showHeader = true }: MessageItemProps) {
  const time = format(new Date(createdAt), 'HH:mm');
  const fullDate = format(new Date(createdAt), 'dd.MM.yyyy HH:mm');

  return (
    <div className="flex gap-4 px-4 py-0.5 hover:bg-bg-hover/30 group">
      {showHeader ? (
        <Avatar src={user.avatarUrl} name={user.displayName} size="sm" className="mt-0.5" />
      ) : (
        <div className="w-8 flex items-center justify-center">
          <span className="text-[10px] text-text-muted opacity-0 group-hover:opacity-100">{time}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        {showHeader && (
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-text-primary text-sm hover:underline cursor-pointer">
              {user.displayName}
            </span>
            <span className="text-xs text-text-muted" title={fullDate}>
              {fullDate}
            </span>
          </div>
        )}
        <p className="text-text-primary text-sm break-words whitespace-pre-wrap">
          {content}
          {editedAt && <span className="text-xs text-text-muted ml-1">(edited)</span>}
        </p>
      </div>
    </div>
  );
}
