'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { useFriendStore } from '@/stores/friendStore';
import api from '@/lib/api';
import type { User } from '@/types';
import toast from 'react-hot-toast';

export default function AddFriend() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const { sendRequest } = useFriendStore();

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 1) {
      setResults([]);
      return;
    }
    try {
      const { data } = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      setResults(data);
    } catch {
      setResults([]);
    }
  };

  const handleSendRequest = async (userId: string) => {
    try {
      await sendRequest(userId);
      setSentIds((prev) => new Set(prev).add(userId));
      toast.success('Friend request sent!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-text-secondary uppercase mb-3">Add Friend</h3>
      <p className="text-sm text-text-muted mb-4">You can add friends by their username.</p>
      <Input
        placeholder="Enter a username..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        autoFocus
      />
      <div className="mt-4 space-y-1 max-h-[400px] overflow-y-auto">
        {results.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-3 px-3 py-2 rounded hover:bg-bg-hover"
          >
            <Avatar src={user.avatarUrl} name={user.displayName} size="sm" status={user.status} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary">{user.displayName}</p>
              <p className="text-xs text-text-muted">{user.username}</p>
            </div>
            <Button
              size="sm"
              variant={sentIds.has(user.id) ? 'secondary' : 'primary'}
              disabled={sentIds.has(user.id)}
              onClick={() => handleSendRequest(user.id)}
            >
              {sentIds.has(user.id) ? 'Sent' : 'Add Friend'}
            </Button>
          </div>
        ))}
        {query.length > 0 && results.length === 0 && (
          <p className="text-sm text-text-muted text-center py-8">No users found.</p>
        )}
      </div>
    </div>
  );
}
