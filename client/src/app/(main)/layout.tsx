'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useFriendStore } from '@/stores/friendStore';
import ServerSidebar from '@/components/navigation/ServerSidebar';
import CallOverlay from '@/components/media/CallOverlay';
import { getSocket } from '@/lib/socket';
import toast from 'react-hot-toast';
import type { Friendship } from '@/types';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const { addIncomingRequest, onRequestAccepted, onFriendRemoved } = useFriendStore();
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Friend socket listeners
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
    if (!socket) return;

    const handleRequestReceived = (friendship: Friendship) => {
      addIncomingRequest(friendship);
      toast(`${friendship.sender.displayName} sent you a friend request!`, { icon: '👋' });
    };

    const handleRequestAccepted = (friendship: Friendship) => {
      onRequestAccepted(friendship);
      toast.success(`${friendship.receiver.displayName} accepted your friend request!`);
    };

    const handleFriendRemoved = ({ friendshipId }: { friendshipId: string }) => {
      onFriendRemoved(friendshipId);
    };

    socket.on('friend:request-received', handleRequestReceived);
    socket.on('friend:request-accepted', handleRequestAccepted);
    socket.on('friend:removed', handleFriendRemoved);

    return () => {
      socket.off('friend:request-received', handleRequestReceived);
      socket.off('friend:request-accepted', handleRequestAccepted);
      socket.off('friend:removed', handleFriendRemoved);
    };
  }, [isAuthenticated, addIncomingRequest, onRequestAccepted, onFriendRemoved]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-tertiary">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="h-screen flex">
      <ServerSidebar />
      <div className="flex-1 flex min-w-0">
        {children}
      </div>
      <CallOverlay />
    </div>
  );
}
