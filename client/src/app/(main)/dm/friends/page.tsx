'use client';

import { useState } from 'react';
import DMSidebar from '@/components/navigation/DMSidebar';
import FriendsList from '@/components/friends/FriendsList';
import FriendRequests from '@/components/friends/FriendRequests';
import AddFriend from '@/components/friends/AddFriend';
import { cn } from '@/lib/utils';

type Tab = 'online' | 'all' | 'pending' | 'add';

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('online');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'online', label: 'Online' },
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'add', label: 'Add Friend' },
  ];

  return (
    <>
      <DMSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-12 px-4 flex items-center gap-4 border-b border-border/50 shadow-sm shrink-0">
          <h2 className="font-semibold text-text-primary">Friends</h2>
          <div className="h-6 w-px bg-border/50" />
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-3 py-1 rounded text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? tab.key === 'add'
                      ? 'bg-success text-white'
                      : 'bg-bg-active text-text-primary'
                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'online' && <FriendsList filter="online" />}
          {activeTab === 'all' && <FriendsList filter="all" />}
          {activeTab === 'pending' && <FriendRequests />}
          {activeTab === 'add' && <AddFriend />}
        </div>
      </div>
    </>
  );
}
