'use client';

import Avatar from '@/components/ui/Avatar';
import type { ServerMember } from '@/types';

interface MemberListProps {
  members: ServerMember[];
  onlineUserIds: Set<string>;
  onMemberClick?: (userId: string) => void;
}

export default function MemberList({ members, onlineUserIds, onMemberClick }: MemberListProps) {
  const online = members.filter((m) => onlineUserIds.has(m.userId));
  const offline = members.filter((m) => !onlineUserIds.has(m.userId));

  return (
    <div className="w-60 bg-bg-secondary overflow-y-auto shrink-0 pt-4">
      {online.length > 0 && (
        <div className="mb-2">
          <h4 className="px-4 text-xs font-semibold uppercase text-text-muted mb-1">
            Online &mdash; {online.length}
          </h4>
          {online.map((member) => (
            <button
              key={member.id}
              onClick={() => onMemberClick?.(member.userId)}
              className="w-full flex items-center gap-3 px-4 py-1.5 hover:bg-bg-hover rounded-sm transition-colors"
            >
              <Avatar src={member.user.avatarUrl} name={member.user.displayName} size="sm" status="ONLINE" />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm text-text-primary truncate">
                  {member.user.displayName}
                  {member.role !== 'MEMBER' && (
                    <span className="ml-1 text-xs text-accent">
                      {member.role === 'OWNER' ? 'Owner' : 'Admin'}
                    </span>
                  )}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {offline.length > 0 && (
        <div>
          <h4 className="px-4 text-xs font-semibold uppercase text-text-muted mb-1">
            Offline &mdash; {offline.length}
          </h4>
          {offline.map((member) => (
            <button
              key={member.id}
              onClick={() => onMemberClick?.(member.userId)}
              className="w-full flex items-center gap-3 px-4 py-1.5 hover:bg-bg-hover rounded-sm transition-colors opacity-50"
            >
              <Avatar src={member.user.avatarUrl} name={member.user.displayName} size="sm" status="OFFLINE" />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm text-text-primary truncate">{member.user.displayName}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
