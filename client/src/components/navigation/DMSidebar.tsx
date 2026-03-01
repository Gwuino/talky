'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { useDMStore } from '@/stores/dmStore';
import { useAuthStore } from '@/stores/authStore';
import { useFriendStore } from '@/stores/friendStore';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { Plus, Users } from 'lucide-react';
import api from '@/lib/api';
import type { User } from '@/types';
import UserPanel from './UserPanel';

export default function DMSidebar() {
  const { conversations, fetchConversations, createConversation } = useDMStore();
  const { incomingRequests, fetchRequests } = useFriendStore();
  const userId = useAuthStore((s) => s.user?.id);
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const activeId = params?.conversationId as string;
  const isFriendsPage = pathname === '/dm/friends';
  const [showNew, setShowNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);

  useEffect(() => {
    fetchConversations();
    fetchRequests();
  }, [fetchConversations, fetchRequests]);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 1) {
      setSearchResults([]);
      return;
    }
    const { data } = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
    setSearchResults(data);
  };

  const handleStartDM = async (targetUserId: string) => {
    const conversation = await createConversation(targetUserId);
    setShowNew(false);
    setSearchQuery('');
    setSearchResults([]);
    router.push(`/dm/${conversation.id}`);
  };

  return (
    <div className="w-60 bg-bg-secondary flex flex-col shrink-0">
      <div className="h-12 px-4 flex items-center border-b border-border/50 shadow-sm">
        <h2 className="font-semibold text-text-primary">Direct Messages</h2>
      </div>

      <div className="px-2 pt-3 pb-2 space-y-0.5">
        <button
          onClick={() => router.push('/dm/friends')}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors',
            isFriendsPage
              ? 'bg-bg-active text-text-primary'
              : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
          )}
        >
          <Users size={16} />
          Friends
          {incomingRequests.length > 0 && (
            <span className="ml-auto bg-danger text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {incomingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setShowNew(true)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary"
        >
          <Plus size={16} /> New Message
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {conversations.map((conv) => {
          const other = conv.otherUser || conv.participants.find((p) => p.userId !== userId)?.user;
          if (!other) return null;
          return (
            <button
              key={conv.id}
              onClick={() => router.push(`/dm/${conv.id}`)}
              className={cn(
                'w-full flex items-center gap-3 px-2 py-2 rounded transition-colors',
                activeId === conv.id ? 'bg-bg-active' : 'hover:bg-bg-hover'
              )}
            >
              <Avatar src={other.avatarUrl} name={other.displayName} size="sm" status={other.status} />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm text-text-primary truncate">{other.displayName}</p>
                {conv.lastMessage && (
                  <p className="text-xs text-text-muted truncate">{conv.lastMessage.content}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <UserPanel />

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="New Message">
        <div className="space-y-3">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />
          <div className="max-h-60 overflow-y-auto space-y-1">
            {searchResults.map((user) => (
              <button
                key={user.id}
                onClick={() => handleStartDM(user.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-bg-hover"
              >
                <Avatar src={user.avatarUrl} name={user.displayName} size="sm" />
                <div className="text-left">
                  <p className="text-sm text-text-primary">{user.displayName}</p>
                  <p className="text-xs text-text-muted">{user.username}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
