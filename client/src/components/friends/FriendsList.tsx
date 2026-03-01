'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFriendStore } from '@/stores/friendStore';
import { useDMStore } from '@/stores/dmStore';
import Avatar from '@/components/ui/Avatar';
import { MessageCircle, UserMinus } from 'lucide-react';
import toast from 'react-hot-toast';

interface FriendsListProps {
  filter: 'all' | 'online';
}

export default function FriendsList({ filter }: FriendsListProps) {
  const { friends, fetchFriends, removeFriend } = useFriendStore();
  const { createConversation } = useDMStore();
  const router = useRouter();

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const filtered = filter === 'online'
    ? friends.filter((f) => f.friend?.status === 'ONLINE')
    : friends;

  const handleMessage = async (userId: string) => {
    try {
      const conversation = await createConversation(userId);
      router.push(`/dm/${conversation.id}`);
    } catch {
      toast.error('Failed to open conversation');
    }
  };

  const handleRemove = async (friendshipId: string) => {
    try {
      await removeFriend(friendshipId);
      toast.success('Friend removed');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove');
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-xs font-semibold text-text-secondary uppercase mb-3">
        {filter === 'online' ? 'Online' : 'All Friends'} — {filtered.length}
      </h3>
      <div className="space-y-1">
        {filtered.map((f) => {
          const friend = f.friend;
          if (!friend) return null;
          return (
            <div
              key={f.id}
              className="flex items-center gap-3 px-3 py-2 rounded hover:bg-bg-hover group"
            >
              <Avatar src={friend.avatarUrl} name={friend.displayName} size="sm" status={friend.status} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary">{friend.displayName}</p>
                <p className="text-xs text-text-muted capitalize">{friend.status?.toLowerCase() || 'offline'}</p>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleMessage(friend.id)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-active text-text-secondary hover:text-text-primary transition-colors"
                  title="Message"
                >
                  <MessageCircle size={18} />
                </button>
                <button
                  onClick={() => handleRemove(f.id)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-active text-text-secondary hover:text-danger transition-colors"
                  title="Remove Friend"
                >
                  <UserMinus size={18} />
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-text-muted text-center py-12">
            {filter === 'online' ? 'No friends are online right now.' : 'No friends yet. Add some!'}
          </p>
        )}
      </div>
    </div>
  );
}
